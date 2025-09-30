'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
  parent_id: z.string().optional().nullable(),
  create_sub_phases: z.boolean().optional(),
});

export async function addProject(formData: z.infer<typeof projectSchema>) {
  const supabase = createServerActionClient({ cookies });
  const parsedData = projectSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }

  const { create_sub_phases, ...projectData } = parsedData.data;

  // Insert the main/parent project first
  const { data: newProject, error: projectError } = await supabase
    .from('projects')
    .insert([{
      ...projectData,
      id: `PROJ-${Date.now()}`,
      start_date: projectData.start_date.toISOString(),
      end_date: projectData.end_date.toISOString(),
    }])
    .select()
    .single();

  if (projectError) {
    console.error('Supabase error creating project:', projectError);
    return { error: `Failed to create project: ${projectError.message}` };
  }
  
  const newProjectId = newProject.id;

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

    const { error: subPhaseError } = await supabase
      .from('projects')
      .insert(subPhasesToInsert);

    if (subPhaseError) {
      console.error('Supabase error creating sub-phases:', subPhaseError);
      return { error: `Project was created, but failed to create its sub-phases: ${subPhaseError.message}` };
    }
  }

  revalidatePath('/dashboard/projects');
  return { data: newProject };
}


const updateProjectSchema = projectSchema.extend({
    id: z.string(),
});

export async function updateProject(formData: z.infer<typeof updateProjectSchema>) {
    const supabase = createServerActionClient({ cookies });
    const parsedData = updateProjectSchema.safeParse(formData);

    if (!parsedData.success) {
        return { error: 'Invalid form data.' };
    }

    const { id, create_sub_phases, ...projectData } = parsedData.data;
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
        return { error: `Failed to update project: ${error.message}` };
    }

    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${id}`);

    return { data };
}

export async function deleteProject(id: string) {
    const supabase = createServerActionClient({ cookies });
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
        console.error('Supabase delete error:', error);
        return { error: `Failed to delete project: ${error.message}` };
    }
    
    revalidatePath('/dashboard/projects');
    return { success: true };
}

export async function getProjects() {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: [], error: 'User not authenticated' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profileError) {
        return { data: [], error: `Could not fetch user profile: ${profileError.message}` };
    }

    const userRole = profile.role;
    
    let query = supabase
        .from('projects')
        .select(`*, users (id, full_name, avatar_url)`);

    // Admins, owners, and clients see all projects.
    // For other roles, we filter based on assignment.
    if (!['admin', 'owner', 'client'].includes(userRole)) {
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('project_id')
            .eq('assignee_id', user.id);
        
        if (tasksError) {
          console.error("Error fetching tasks for project filtering:", tasksError);
          return { data: [], error: 'Could not fetch user tasks.'};
        }
        
        const projectIdsFromTasks = tasks ? tasks.map(t => t.project_id) : [];

        // Build a filter condition: assigned to user OR parent of a project assigned to user OR in a project where user has a task.
        query = query.or(`assignee_id.eq.${user.id},id.in.(${projectIdsFromTasks.join(',')})`);
    }

    const { data, error } = await query.order('start_date', { ascending: false });
        
    return { data, error: error?.message };
}

export async function getProjectById(id: string) {
    const supabase = createServerActionClient({ cookies });

    const { data, error } = await supabase
        .from('projects')
        .select(`*, users (id, full_name, avatar_url)`)
        .eq('id', id)
        .single();
    
    return { data, error: error?.message };
}
