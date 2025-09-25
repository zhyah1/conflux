'use server';

import { supabase } from '@/lib/supabase-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  status: z.string().min(1, 'Status is required.'),
  assignee_id: z.string().uuid().optional().nullable(),
});

export async function addTask(formData: z.infer<typeof taskSchema>) {
  const parsedData = taskSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { title, priority, status, assignee_id } = parsedData.data;

  // Generate a unique ID for the task
  const id = `TASK-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ id, title, priority, status, assignee_id }])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { error: 'Failed to create task in the database.' };
  }
  
  // Revalidate the tasks page to show the new task
  revalidatePath('/dashboard/tasks');

  return { data };
}
