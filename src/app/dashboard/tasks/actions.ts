'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  status: z.string().min(1, 'Status is required.'),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().min(1, 'Project ID is required.'),
});

export async function addTask(formData: z.infer<typeof taskSchema>) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedData = taskSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { project_id, assignee_id, ...taskData } = parsedData.data;

  // Server-side permission check
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['admin', 'pmc', 'contractor', 'subcontractor'].includes(profile.role)) {
     return { error: 'You do not have permission to add tasks.' };
  }
  
  const id = `TASK-${Date.now()}`;
  
  // Ensure assignee_id is either a valid UUID or null.
  const finalAssigneeId = assignee_id === 'null' || assignee_id === '' ? null : assignee_id;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ 
        id, 
        ...taskData,
        assignee_id: finalAssigneeId, 
        project_id, 
        created_by: user.id 
    }])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { error: 'Failed to create task in the database.' };
  }
  
  revalidatePath(`/dashboard/tasks/${project_id}`);

  return { data };
}

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  status: z.string().min(1, 'Status is required.'),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().min(1, 'Project ID is required.'),
  approver_id: z.string().uuid().optional().nullable(),
});

export async function updateTask(formData: z.infer<typeof updateTaskSchema>) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const parsedData = updateTaskSchema.safeParse(formData);

    if (!parsedData.success) {
        return { error: 'Invalid form data.' };
    }

    const { id, project_id, ...taskData } = parsedData.data;
    
    const updateData: { [key: string]: any } = { ...taskData };
    if (taskData.assignee_id === 'null' || taskData.assignee_id === '' || !taskData.assignee_id) {
      updateData.assignee_id = null;
    }
    if (taskData.approver_id === 'null' || taskData.approver_id === '' || !taskData.approver_id) {
      updateData.approver_id = null;
    }


    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Supabase update error:', error);
        return { error: 'Failed to update task in the database.' };
    }

    revalidatePath(`/dashboard/tasks/${project_id}`);
    revalidatePath('/dashboard/approvals');

    return { data };
}

export async function getTasksByProjectId(projectId: string) {
  // Use the admin client to bypass RLS for this server-side fetch.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select(`id, title, status, priority, project_id, approver_id, users:assignee_id (id, full_name, avatar_url)`)
    .eq('project_id', projectId);
  
  if (error) {
    console.error("Server-side error fetching tasks: ", error);
    return { data: null, error: `Failed to fetch tasks: ${error.message}` };
  }

  return { data, error: null };
}

const approvalRequestSchema = z.object({
  task_id: z.string(),
  approver_id: z.string().uuid(),
  message: z.string().optional(),
});

export async function requestTaskApproval(formData: z.infer<typeof approvalRequestSchema>) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const parsedData = approvalRequestSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: `Invalid form data: ${parsedData.error.message}` };
    }

    const { task_id, approver_id, message } = parsedData.data;

    // 1. Update the task status and approver
    const { data: taskUpdateData, error: taskUpdateError } = await supabase
        .from('tasks')
        .update({ status: 'Waiting for Approval', approver_id: approver_id })
        .eq('id', task_id)
        .select('project_id')
        .single();
        
    if (taskUpdateError) {
        console.error('Error updating task for approval:', taskUpdateError);
        return { error: `Could not update task: ${taskUpdateError.message}` };
    }
    
    // 2. Log the approval request
    const { error: approvalLogError } = await supabase
        .from('task_approvals')
        .insert({
            task_id: task_id,
            requested_by_id: user.id,
            approver_id: approver_id,
            status: 'pending',
            message: message,
        });

    if (approvalLogError) {
        console.error('Error logging approval request:', approvalLogError);
        // This is not a critical failure, so we just log it and continue
    }
    
    revalidatePath(`/dashboard/tasks/${taskUpdateData.project_id}`);
    revalidatePath('/dashboard/approvals');

    return { success: true };
}


export async function getApprovalRequests() {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .select(`
            id,
            title,
            priority,
            project:project_id ( id, name ),
            requested_by:created_by ( id, full_name ),
            approver:approver_id (id, full_name)
        `)
        .eq('status', 'Waiting for Approval')
        .eq('approver_id', user.id);

    if (error) {
        console.error('Error fetching approval requests:', error);
        return { data: null, error: `Could not fetch approvals: ${error.message}` };
    }

    return { data, error: null };
}

export async function decideOnApproval(taskId: string, newStatus: 'Backlog' | 'Blocked', projectId: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    
    // Update task status and clear approver_id
    const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: newStatus, approver_id: null })
        .eq('id', taskId);

    if (taskError) {
        console.error('Error updating task status after approval:', taskError);
        return { error: `Could not update task: ${taskError.message}` };
    }

    // Update the task_approvals log
    const { error: logError } = await supabase
        .from('task_approvals')
        .update({ status: newStatus === 'Backlog' ? 'approved' : 'rejected' })
        .eq('task_id', taskId)
        .eq('approver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

     if (logError) {
        console.error('Error updating approval log:', logError);
    }
    
    revalidatePath(`/dashboard/tasks/${projectId}`);
    revalidatePath('/dashboard/approvals');

    return { success: true };
}
