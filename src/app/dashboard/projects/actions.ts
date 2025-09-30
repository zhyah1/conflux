
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { supabase as supabaseAdmin } from '@/lib/supabase-server';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required.'),
  status: z.string().min(1, 'Status is required.'),
  owner: z.string().optional(),
  budget: z.coerce.number().positive('Budget must be a positive number.'),
  completion: z.coerce.number().min(0).max(100, 'Completion must be between 0 and 100.'),
  start_date: z.date({ required_error: 'Start date is required.' }),
  end_date: z.date({ required_error: 'End date is required.' }),
  assignee_id: z.string().uuid().optional().nullable(),
  parent_id: z.string().optional().nullable(),
});

export async function addProject(formData: z.infer<typeof projectSchema>) {
  const parsedData = projectSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }

  const { parent_id, ...projectData } = parsedData.data;

  // If it's a sub-project, insert it normally.
  if (parent_id) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([{ 
        ...projectData, 
        id: `PROJ-${Date.now()}`,
        start_date: projectData.start_date.toISOString(),
        end_date: projectData.end_date.toISOString(),
        parent_id 
      }])
      .select();

    if (error) {
      console.error('Supabase error (sub-project):', error);
      return { error: 'Failed to create sub-project.' };
    }
    revalidatePath('/dashboard/projects');
    return { data };
  }

  // If it's a master project, call the database function to create it with sub-phases.
  const { name, status, owner, budget, completion, start_date, end_date, assignee_id } = projectData;
  const { data, error } = await supabaseAdmin.rpc('create_project_with_subphases', {
    name_in: name,
    status_in: status,
    owner_in: owner,
    budget_in: budget,
    completion_in: completion,
    start_date_in: start_date.toISOString(),
    end_date_in: end_date.toISOString(),
    assignee_id_in: assignee_id,
  });

  if (error) {
    console.error('Supabase RPC error (master project):', error);
    return { error: 'Failed to create master project with sub-phases.' };
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


    const { data, error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: 'Failed to delete project from the database.' };
    }
    
    revalidatePath('/dashboard/projects');
    return { success: true };
}

async function getUserRole() {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile.role;
}


export async function getProjects() {
    const supabase = createServerActionClient({ cookies });
    const role = await getUserRole();

    const dbClient = role === 'admin' ? supabaseAdmin : supabase;

    const { data, error } = await dbClient
        .from('projects')
        .select(`*, users (id, full_name, avatar_url)`)
        .order('start_date', { ascending: false });
        
    return { data, error: error?.message };
}

export async function getProjectById(id: string) {
    const supabase = createServerActionClient({ cookies });
    const role = await getUserRole();

    const dbClient = role === 'admin' ? supabaseAdmin : supabase;

    const { data, error } = await dbClient
        .from('projects')
        .select(`*, users (id, full_name, avatar_url)`)
        .eq('id', id)
        .single();
    
    return { data, error: error?.message };
}
