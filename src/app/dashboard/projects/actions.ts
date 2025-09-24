'use server';

import { supabase } from '@/lib/supabase-server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const projectSchema = z.object({
  name: z.string(),
  status: z.string(),
  owner: z.string().optional(),
  budget: z.number(),
  completion: z.number(),
  start_date: z.date(),
  end_date: z.date(),
});

export async function addProject(formData: z.infer<typeof projectSchema>) {
  const parsedData = projectSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: 'Invalid form data.' };
  }

  const { name, status, owner, budget, completion, start_date, end_date } = parsedData.data;

  // Generate a unique ID for the project
  const id = `PROJ-${Date.now()}`;
  
  const { data, error } = await supabase
    .from('projects')
    .insert([{ id, name, status, owner, budget, completion, start_date: start_date.toISOString(), end_date: end_date.toISOString() }])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { error: 'Failed to create project in the database.' };
  }
  
  // Revalidate the projects page to show the new project
  revalidatePath('/dashboard/projects');

  return { data };
}
