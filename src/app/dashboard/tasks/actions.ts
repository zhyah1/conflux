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

  if (!['owner', 'admin', 'pmc', 'contractor'].includes(profile.role)) {
    return { error: 'You do not have permission to create tasks.' };
  }

  const parsedData = taskSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  // Hierarchical check
  if (profile.role === 'contractor') {
      const { data: assigneeProfile } = await supabase.from('users').select('role').eq('id', parsedData.data.assignee_id).single();
      if(assigneeProfile && assigneeProfile.role !== 'subcontractor'){
         return { error: 'Contractors can only assign tasks to subcontractors.' };
      }
  }
  if (profile.role === 'pmc') {
      const { data: assigneeProfile } = await supabase.from('users').select('role').eq('id', parsedData.data.assignee_id).single();
      if(assigneeProfile && !['contractor', 'subcontractor'].includes(assigneeProfile.role)){
         return { error: 'PMCs can only assign tasks to contractors or subcontractors.' };
      }
  }


  const { title, priority, status, assignee_id, project_id } = parsedData.data;

  const id = `TASK-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ id, title, priority, status, assignee_id, project_id, created_by: user.id }])
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
    
    // Permission Check
    const isOwnerOrAdminOrPMC = ['owner', 'admin', 'pmc'].includes(profile.role);
    const { data: task, error: taskError } = await supabase.from('tasks').select('assignee_id').eq('id', parsedData.data.id).single();

    if (taskError) {
        return { error: 'Task not found.' };
    }

    const isAssigned = task.assignee_id === user.id;

    if (!isOwnerOrAdminOrPMC && !isAssigned) {
      return { error: 'You do not have permission to update this task.' };
    }

    const { id, project_id, ...taskData } = parsedData.data;
    
    const updateData: { [key: string]: any } = { ...taskData };
    if (taskData.assignee_id === 'null' || taskData.assignee_id === '') {
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
