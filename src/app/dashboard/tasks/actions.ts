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
  approver_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
});

async function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}


export async function addTask(formData: z.infer<typeof taskSchema>) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedData = taskSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { project_id, assignee_id, approver_id, ...taskData } = parsedData.data;

  // Server-side permission check
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['admin', 'pmc', 'contractor', 'subcontractor'].includes(profile.role)) {
     return { error: 'You do not have permission to add tasks.' };
  }
  
  const id = `TASK-${Date.now()}`;
  
  // Ensure assignee_id is either a valid UUID or null.
  const finalAssigneeId = assignee_id === 'null' || assignee_id === '' ? null : assignee_id;
  const finalApproverId = approver_id === 'null' || approver_id === '' ? null : approver_id;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ 
        id, 
        ...taskData,
        assignee_id: finalAssigneeId,
        approver_id: finalApproverId, 
        project_id, 
        created_by: user.id 
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return { error: 'Failed to create task in the database.' };
  }

  // If the task was created for approval, also log it in the approvals table
  if (data && taskData.status === 'Waiting for Approval' && finalApproverId) {
      const { error: approvalLogError } = await supabase
        .from('task_approvals')
        .insert({
            task_id: data.id,
            requested_by_id: user.id,
            approver_id: finalApproverId,
            status: 'pending',
            message: 'New task created, pending approval.',
        });
      if (approvalLogError) {
          console.warn('Task created, but failed to log approval request:', approvalLogError.message);
      }
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
  project_id: z.string().min(1, "Project ID is required."),
  approver_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
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
    revalidatePath(`/dashboard/tasks/view/${id}`);

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
    .select(`id, title, status, priority, project_id, approver_id, description, due_date, progress, users:assignee_id (id, full_name, avatar_url, role)`)
    .eq('project_id', projectId);
  
  if (error) {
    console.error("Server-side error fetching tasks: ", error);
    return { data: null, error: `Failed to fetch tasks: ${error.message}` };
  }

  return { data, error: null };
}

export async function getTaskById(taskId: string) {
  const supabaseAdmin = await getAdminSupabase();

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select(`id, title, status, priority, project_id, approver_id, description, due_date, progress, users:assignee_id (id, full_name, avatar_url, role)`)
    .eq('id', taskId)
    .single();

  if (error) {
    console.error("Server-side error fetching task: ", error);
    return { data: null, error: `Failed to fetch task: ${error.message}` };
  }
  
  return { data, error: null };
}

const approvalRequestSchema = z.object({
  task_id: z.string(),
  approver_id: z.string().uuid('Please select an approver.'),
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

    const supabaseAdmin = await getAdminSupabase();
    
    const { data: tasks, error } = await supabaseAdmin
        .from('tasks')
        .select(`
            id,
            title,
            priority,
            project:project_id ( 
              id, 
              name,
              parent:parent_id (
                id,
                name
              )
            ),
            requested_by:created_by ( id, full_name )
        `)
        .eq('status', 'Waiting for Approval')
        .eq('approver_id', user.id);

    if (error) {
        console.error('Error fetching approval requests (tasks):', error);
        return { data: null, error: `Could not fetch approvals: ${error.message}` };
    }

    return { data: tasks, error: null };
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
        .update({ status: newStatus === 'Backlog' ? 'approved' : 'rejected', decided_at: new Date().toISOString() })
        .eq('task_id', taskId)
        .eq('approver_id', user.id)
        .eq('status', 'pending');


     if (logError) {
        console.error('Error updating approval log:', logError);
    }
    
    revalidatePath(`/dashboard/tasks/${projectId}`);
    revalidatePath('/dashboard/approvals');

    return { success: true };
}


// Server action to get comments for a specific task
export async function getTaskComments(taskId: string) {
  const supabaseAdmin = await getAdminSupabase();
  
  const { data: commentsData, error: commentsError } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
    
  if (commentsError) {
    console.error('Error fetching task comments:', commentsError);
    return { data: null, error: `Could not fetch comments: ${commentsError.message}` };
  }

  if (!commentsData || commentsData.length === 0) {
    return { data: [], error: null };
  }

  const userIds = [...new Set(commentsData.map(c => c.user_id))];
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, full_name, role, avatar_url')
    .in('id', userIds);

  if (usersError) {
    console.error('Error fetching comment authors:', usersError);
    return { data: null, error: `Could not fetch comment authors: ${usersError.message}` };
  }

  const userMap = new Map(usersData.map(u => [u.id, u]));

  const data = commentsData.map(comment => ({
    ...comment,
    user: userMap.get(comment.user_id) || null
  }));
  
  return { data, error: null };
}

// Server action to add a comment to a task
const taskCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty."),
  task_id: z.string(),
});

export async function addTaskComment(formData: z.infer<typeof taskCommentSchema>) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const parsedData = taskCommentSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: 'Invalid comment data.' };
    }

    const { data, error } = await supabase
        .from('task_comments')
        .insert({
            ...parsedData.data,
            user_id: user.id
        })
        .select()
        .single();
        
    if (error) {
        console.error('Error adding task comment:', error);
        return { error: `Could not post comment: ${error.message}` };
    }
    
    // No revalidation needed due to real-time subscription
    return { data };
}


// --- Attachment Actions ---

const attachmentSchema = z.object({
  task_id: z.string(),
  file_path: z.string(),
  file_name: z.string(),
});

export async function addTaskAttachment(formData: z.infer<typeof attachmentSchema>) {
  const supabase = await getAdminSupabase();
  const { data: { user } } = await createServerActionClient({ cookies }).auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedData = attachmentSchema.safeParse(formData);
  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }

  const { data, error } = await supabase
    .from('task_attachments')
    .insert([{ ...parsedData.data, uploaded_by: user.id }])
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating attachment record:', error);
    return { error: `Failed to create attachment record: ${error.message}` };
  }

  revalidatePath(`/dashboard/tasks/view/${parsedData.data.task_id}`);
  return { data };
}

export async function uploadTaskFile(file: File, taskId: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `tasks/${taskId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return { path: null, error: `Failed to upload file: ${uploadError.message}` };
    }

    return { path: filePath, error: null };
}

export async function getTaskAttachments(taskId: string) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('task_attachments')
    .select('id, file_name, file_path, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attachments:', error);
    return { data: null, error: `Could not fetch attachments: ${error.message}` };
  }

  return { data, error: null };
}

export async function getTaskAttachmentSignedUrl(filePath: string) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60); // URL is valid for 60 seconds

  if (error) {
    console.error('Error creating signed URL:', error);
    return { data: null, error: 'Could not get attachment URL.' };
  }

  return { data, error: null };
}
