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

  const parsedData = taskSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { project_id, assignee_id, ...taskData } = parsedData.data;

  // Server-side permission check
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['owner', 'admin'].includes(profile.role)) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('parent_id')
      .eq('id', project_id)
      .single();

    if (projectError) {
      return { error: 'Could not find the specified project.' };
    }

    const projectIdsToCheck = [project_id];
    if (project.parent_id) {
      projectIdsToCheck.push(project.parent_id);
    }

    const { data: projectMembership, error: membershipError } = await supabase
      .from('project_users')
      .select('user_id')
      .in('project_id', projectIdsToCheck)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !projectMembership) {
      return { error: 'You can only add tasks to projects you are a member of.' };
    }
  }
  
  const id = `TASK-${Date.now()}`;
  
  // Ensure assignee_id is either a valid UUID or null.
  const finalAssigneeId = assignee_id === 'null' ? null : assignee_id;

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
