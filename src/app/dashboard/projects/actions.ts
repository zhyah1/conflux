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
  assignee_ids: z.array(z.string().uuid()).optional(), // Changed to array
  parent_id: z.string().optional().nullable(),
  create_sub_phases: z.boolean().optional(),
});

export async function addProject(formData: z.infer<typeof projectSchema>) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found.' };

  if (!['owner', 'admin', 'pmc'].includes(profile.role)) {
    return { error: 'You do not have permission to add projects.' };
  }
  
  const parsedData = projectSchema.safeParse(formData);
  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }
  
  if (profile.role === 'pmc' && !parsedData.data.parent_id) {
    return { error: 'Project Managers must assign a parent project.' };
  }

  const { create_sub_phases, assignee_ids, ...projectData } = parsedData.data;
  const newProjectId = `PROJ-${Date.now()}`;

  const { data: newProject, error: projectError } = await supabase
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
    return { error: `Failed to create project: ${projectError.message}` };
  }

  // Handle multi-user assignments
  if (assignee_ids && assignee_ids.length > 0) {
    const userAssignments = assignee_ids.map(user_id => ({ project_id: newProjectId, user_id }));
    const { error: assignmentError } = await supabase.from('project_users').insert(userAssignments);
    if (assignmentError) {
      console.error('Supabase error assigning users:', assignmentError);
      // Don't block, just log the error
    }
  }
  
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
        parent_id: newProjectId,
    }));
    const { error: subPhaseError } = await supabase.from('projects').insert(subPhasesToInsert);
    if (subPhaseError) {
      console.error('Supabase error creating sub-phases:', subPhaseError);
      return { error: `Project was created, but failed to create sub-phases: ${subPhaseError.message}` };
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
    
    const { id, create_sub_phases, assignee_ids, ...projectData } = parsedData.data;

    const { data: projectMembers } = await supabase
      .from('project_users')
      .select('user_id')
      .eq('project_id', id);

    const isMember = projectMembers?.some(m => m.user_id === user.id);

    if (!['owner', 'admin'].includes(profile.role) && !isMember) {
      return { error: 'You do not have permission to edit this project.' };
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

    if (['owner', 'admin', 'pmc', 'contractor'].includes(profile.role)) {
      const { error: deleteError } = await supabase.from('project_users').delete().eq('project_id', id);
      if (deleteError) {
          console.error('Error clearing old assignments', deleteError);
          return { error: `Failed to update user assignments: ${deleteError.message}` };
      }

      if (assignee_ids && assignee_ids.length > 0) {
          const userAssignments = assignee_ids.map(user_id => ({ project_id: id, user_id }));
          const { error: assignmentError } = await supabase.from('project_users').insert(userAssignments);
          if (assignmentError) {
              console.error('Supabase error re-assigning users:', assignmentError);
              return { error: `Failed to update user assignments: ${assignmentError.message}` };
          }
      }
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

// Get all projects based on user role
export async function getProjects() {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: null, error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (!profile) return { data: null, error: 'Profile not found' };

    let query = supabase
        .from('projects')
        .select(`
            *,
            users:project_users(
                users(id, full_name, avatar_url, role)
            )
        `);

    if (!['admin', 'owner', 'client'].includes(profile.role)) {
      const { data: userProjects, error: userProjectsError } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (userProjectsError) {
        console.error('getProjects (userProjects) error:', userProjectsError.message);
        return { data: [], error: `Could not fetch user projects: ${userProjectsError.message}` };
      }
      
      const projectIds = userProjects.map(p => p.project_id);
       if (projectIds.length === 0) {
        return { data: [], error: null };
      }
      query = query.in('id', projectIds);
    }
    
    const { data, error } = await query.order('start_date', { ascending: false });

    if (error) {
        console.error('getProjects error:', error.message);
        return { data: null, error: `Could not fetch projects: ${error.message}` };
    }
    
    const formattedData = data.map(project => ({
        ...project,
        users: project.users.map((u: any) => u.users)
    }));

    return { data: formattedData, error: null };
}

// Get a single project by ID, respecting RLS
export async function getProjectById(id: string) {
    const supabase = createServerActionClient({ cookies });
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };
    
    let query = supabase
        .from('projects')
        .select(`
            *,
            users:project_users(
                users(id, full_name, avatar_url, role)
            )
        `)
        .eq('id', id);

    const { data, error } = await query.single();
    
     if (error) {
        return { data: null, error: `Could not fetch project: ${error.message}` };
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

    if (!['admin', 'owner', 'client'].includes(profile!.role)) {
      const isMember = data.users.some((u: any) => u.users && u.users.id === user.id);
      if (!isMember) {
        return { data: null, error: "You don't have permission to view this project." };
      }
    }

    const formattedData = {
        ...data,
        users: data.users.map((u: any) => u.users).filter(Boolean) // Filter out null/undefined users
    };
    
    return { data: formattedData, error: null };
}
