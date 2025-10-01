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

  if (!['owner', 'admin', 'pmc', 'contractor', 'subcontractor'].includes(profile.role)) {
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
    .select(`id, title, status, priority, project_id, users (id, full_name, avatar_url)`)
    .eq('project_id', projectId);
  
  if (error) {
    console.error("Server-side error fetching tasks: ", error);
    return { data: null, error: `Failed to fetch tasks: ${error.message}` };
  }

  return { data, error: null };
}

    