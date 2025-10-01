'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['owner', 'admin', 'pmc'].includes(profile.role)) {
    return { error: 'You do not have permission to create tasks.' };
  }

  const parsedData = taskSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { title, priority, status, assignee_id, project_id } = parsedData.data;

  // Generate a unique ID for the task
  const id = `TASK-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ id, title, priority, status, assignee_id, project_id }])
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

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!profile) return { error: 'Profile not found' };

    const parsedData = updateTaskSchema.safeParse(formData);

    if (!parsedData.success) {
        return { error: 'Invalid form data.' };
    }

    const { id, project_id, ...taskData } = parsedData.data;
    
    // Authorization check
    if (!['owner', 'admin', 'pmc'].includes(profile.role)) {
      if (['contractor', 'subcontractor'].includes(profile.role)) {
        const { data: originalTask, error: taskError } = await supabase
          .from('tasks')
          .select('assignee_id')
          .eq('id', id)
          .single();
        
        if (taskError || originalTask.assignee_id !== user.id) {
          return { error: 'You can only update tasks assigned to you.' };
        }
      } else {
        return { error: 'You do not have permission to update tasks.' };
      }
    }

    const updateData: { [key: string]: any } = { ...taskData };
    if (taskData.assignee_id === 'null') {
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
