'use server';

import { supabase } from '@/lib/supabase-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  status: z.string().min(1, 'Status is required.'),
  owner: z.string().optional(),
  budget: z.coerce.number().positive('Budget must be a positive number.'),
  completion: z.coerce.number().min(0).max(100, 'Completion must be between 0 and 100.'),
  start_date: z.date({ required_error: 'Start date is required.' }),
  end_date: z.date({ required_error: 'End date is required.' }),
  assignee_id: z.string().uuid().optional().nullable(),
});

export async function addProject(formData: z.infer<typeof projectSchema>) {
  const parsedData = projectSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { name, status, owner, budget, completion, start_date, end_date, assignee_id } = parsedData.data;

  // Generate a unique ID for the project
  const id = `PROJ-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{ id, name, status, owner, budget, completion, start_date: start_date.toISOString(), end_date: end_date.toISOString(), assignee_id }])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { error: 'Failed to create project in the database.' };
  }
  
  revalidatePath('/dashboard/projects');

  return { data };
}

const updateProjectSchema = projectSchema.extend({
    id: z.string(),
});

export async function updateProject(formData: z.infer<typeof updateProjectSchema>) {
    const parsedData = updateProjectSchema.safeParse(formData);

    if (!parsedData.success) {
        return { error: 'Invalid form data.' };
    }

    const { id, ...projectData } = parsedData.data;
     const { start_date, end_date, ...restOfData } = projectData;


    const { data, error } = await supabase
        .from('projects')
        .update({
          ...restOfData,
          start_date: start_date.toISOString(),
          end_date: end_date.toISOString()
        })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Supabase update error:', error);
        return { error: 'Failed to update project in the database.' };
    }

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${id}`);

    return { data };
}

export async function deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: 'Failed to delete project from the database.' };
    }
    
    revalidatePath('/dashboard/projects');
    return { success: true };
}
