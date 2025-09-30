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
  create_sub_phases: z.boolean().optional(),
});

export async function addProject(formData: z.infer<typeof projectSchema>) {
  const parsedData = projectSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }

  const { create_sub_phases, ...projectData } = parsedData.data;
  const newProjectId = `PROJ-${Date.now()}`;

  // Insert the main/parent project first
  const { data: newProject, error: projectError } = await supabaseAdmin
    .from('projects')
    .insert([{
      ...projectData,
      id: newProjectId,
      start_date: projectData.start_date.toISOString(),
      end_date: projectData.end_date.toISOString(),
    }])
    .select()
    .single();

  if (projectError) {
    console.error('Supabase error creating project:', projectError);
    return { error: 'Failed to create project.' };
  }

  // If the checkbox was checked, create the standard sub-phases
  if (create_sub_phases) {
    const subphase_names = [
        'Preconstruction',
        'Structural Work',
        'MEP Core Services',
        'Interior and Finishes',
        'Soft Finishes and Landscaping',
        'Testing, Commissioning and Hand Over'
    ];

    const subPhasesToInsert = subphase_names.map((name, index) => ({
        id: `PROJ-${Date.now() + index + 1}`,
        name: name,
        status: 'Planning',
        owner: projectData.owner,
        budget: 0,
        completion: 0,
        start_date: projectData.start_date.toISOString(),
        end_date: projectData.end_date.toISOString(),
        assignee_id: projectData.assignee_id,
        parent_id: newProjectId,
    }));

    const { error: subPhaseError } = await supabaseAdmin
      .from('projects')
      .insert(subPhasesToInsert);

    if (subPhaseError) {
      console.error('Supabase error creating sub-phases:', subPhaseError);
      // We don't return here, as the main project was still created.
      // We could add logic to delete the main project if sub-phase creation fails.
      return { error: 'Project was created, but failed to create its sub-phases.' };
    }
  }

  revalidatePath('/dashboard/projects');
  return { data: newProject };
}


const updateProjectSchema = projectSchema.extend({
    id: z.string(),
});

export async function updateProject(formData: z.infer<typeof updateProjectSchema>) {
    const parsedData = updateProjectSchema.safeParse(formData);

    if (!parsedData.success) {
        return { error: 'Invalid form data.' };
    }

    const { id, create_sub_phases, ...projectData } = parsedData.data;
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
