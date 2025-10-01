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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['owner', 'admin'].includes(profile.role)) {
    if (profile.role === 'pmc' && !formData.parent_id) {
       return { error: 'PMCs can only create sub-projects and must assign a parent project.' };
    } else if (profile.role === 'pmc') {
      // PMC can proceed
    }
    else {
      return { error: 'You do not have permission to create projects.' };
    }
  }

  const parsedData = projectSchema.safeParse(formData);

  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }

  const { create_sub_phases, ...projectData } = parsedData.data;

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!profile) return { error: 'Profile not found' };

    const parsedData = updateProjectSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: 'Invalid form data.' };
    }
    
    const { id, create_sub_phases, ...projectData } = parsedData.data;

    // Permission Check
    const isOwnerOrAdmin = ['owner', 'admin'].includes(profile.role);
    const isAssigned = projectData.assignee_id === user.id;
    const canUpdate = isOwnerOrAdmin || (['pmc', 'contractor'].includes(profile.role) && isAssigned);

    if (!canUpdate) {
      return { error: 'You do not have permission to update this project.' };
    }

    const { start_date, end_date, ...restOfData } = projectData;

    const { data, error } = await supabase.from('projects').update({
      ...restOfData,
      start_date: start_date.toISOString(),
      end_date: end_date.toISOString()
    }).eq('id', id).select();

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!profile) return { error: 'Profile not found' };

    if (!['owner', 'admin'].includes(profile.role)) {
      return { error: 'You do not have permission to delete projects.' };
    }

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
    if (!user) return { data: [], error: 'User not authenticated' };
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { data: [], error: `Could not fetch user profile: ${profileError.message}` };
    }

    const userRole = profile.role;

    if (userRole === 'owner' || userRole === 'admin' || userRole === 'client') {
      const { data, error } = await supabase.from('projects').select(`*, users (id, full_name, avatar_url)`).order('start_date', { ascending: false });
      return { data, error: error?.message };
    } 
    
    // For PMCs, Contractors, and Subcontractors
    // 1. Get projects they are directly assigned to
    const { data: assignedProjects, error: assignedProjectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('assignee_id', user.id);

    if (assignedProjectsError) {
      return { data: [], error: `Could not fetch assigned projects: ${assignedProjectsError.message}` };
    }
    const assignedProjectIds = assignedProjects.map(p => p.id);

    // 2. Get projects where they have assigned tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('assignee_id', user.id);
    
    if (tasksError) {
      return { data: [], error: `Could not fetch user's tasks: ${tasksError.message}` };
    }
    const taskProjectIds = tasks.map(t => t.project_id);

    // 3. For PMCs, get projects where they have assigned tasks to others
    let managedProjectIds: string[] = [];
    if (userRole === 'pmc') {
      const { data: managedTasks, error: managedTasksError } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('created_by', user.id); // Assuming a created_by column exists or logic to determine this

      if (managedTasksError) {
        console.error('Could not fetch managed tasks for PMC:', managedTasksError.message);
      } else {
        managedProjectIds = managedTasks.map(t => t.project_id);
      }
    }

    const allVisibleProjectIds = [...new Set([...assignedProjectIds, ...taskProjectIds, ...managedProjectIds])];

    if (allVisibleProjectIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`*, users (id, full_name, avatar_url)`)
      .in('id', allVisibleProjectIds)
      .order('start_date', { ascending: false });
        
    if (error) {
      console.error('Error fetching projects:', error);
      return { data: [], error: `Could not fetch projects: ${error.message}` };
    }
    
    return { data, error: null };
}

export async function getProjectById(id: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) return { data: null, error: `Could not fetch user profile: ${profileError.message}` };
    
    const userRole = profile.role;

    const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`*, users (id, full_name, avatar_url)`)
        .eq('id', id)
        .single();
    
    if (projectError) {
      return { data: null, error: `Project not found: ${projectError.message}` };
    }
    
    // Permission Check
    if (userRole === 'owner' || userRole === 'admin' || userRole === 'client') {
      return { data: projectData, error: null };
    }
    
    if (projectData.assignee_id === user.id) {
       return { data: projectData, error: null };
    }

    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', id)
      .eq('assignee_id', user.id)
      .limit(1);

    if (taskError) {
      return { data: null, error: `Error checking task assignments: ${taskError.message}` };
    }
    if (tasks && tasks.length > 0) {
      return { data: projectData, error: null };
    }

    if (userRole === 'pmc') {
      const { data: managedTasks, error: managedTaskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', id)
        .eq('created_by', user.id) // Assuming a created_by column exists
        .limit(1);
      
      if (managedTaskError) {
        return { data: null, error: `Error checking managed tasks: ${managedTaskError.message}` };
      }
      if (managedTasks && managedTasks.length > 0) {
        return { data: projectData, error: null };
      }
    }

    return { data: null, error: "You do not have permission to view this project." };
}
