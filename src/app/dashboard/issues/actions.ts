'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// This is a server-only admin client to bypass RLS for data fetching.
import { createClient } from '@supabase/supabase-js';

async function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}


export async function getIssues(page = 1, pageSize = 10, projectId?: string) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated', count: 0 };

  const supabaseAdmin = await getAdminSupabase();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let countQuery = supabaseAdmin.from('issues').select('id', { count: 'exact', head: true });
  if (projectId) {
    countQuery = countQuery.eq('project_id', projectId);
  }
  const { count, error: countError } = await countQuery;
  
  if (countError) {
      console.error('getIssues (count) error:', countError.message);
      return { data: null, error: `Could not count issues: ${countError.message}`, count: 0 };
  }

  let query = supabaseAdmin.from('issues').select(`
    id,
    title,
    status,
    priority,
    assignee_id,
    project:project_id ( id, name )
  `).range(from, to);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: issuesData, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('getIssues (issues) error:', error.message);
    return { data: null, error: `Could not fetch issues: ${error.message}`, count: 0 };
  }

  if (!issuesData) {
    return { data: [], error: null, count: 0 };
  }

  const assigneeIds = issuesData
    .map(issue => issue.assignee_id)
    .filter((id): id is string => id !== null);

  if (assigneeIds.length === 0) {
    const formattedData = issuesData.map(issue => ({
      ...issue,
      assignee: 'Unassigned',
      project_name: issue.project?.name || 'Unknown Project',
      project_id: issue.project?.id
    }));
    return { data: formattedData, error: null, count: count ?? 0 };
  }

  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .in('id', assigneeIds);

  if (usersError) {
    console.error('getIssues (users) error:', usersError.message);
    return { data: null, error: `Could not fetch assignees: ${usersError.message}`, count: 0 };
  }
  
  const userMap = new Map(usersData.map(u => [u.id, u.full_name]));

  const formattedData = issuesData.map(issue => ({
    ...issue,
    assignee: issue.assignee_id ? userMap.get(issue.assignee_id) || 'Unknown User' : 'Unassigned',
    project_name: issue.project?.name || 'Unknown Project',
    project_id: issue.project?.id
  }));

  return { data: formattedData, error: null, count: count ?? 0 };
}

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  project_id: z.string().min(1, 'Project is required.'),
  status: z.string().min(1, 'Status is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  assignee_id: z.string().uuid().optional().nullable(),
});

export async function addIssue(formData: z.infer<typeof issueSchema>) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedData = issueSchema.safeParse(formData);
  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }
  
  const id = `ISSUE-${Date.now()}`;

  const { data, error } = await supabase
    .from('issues')
    .insert([{ id, ...parsedData.data, created_by: user.id }])
    .select();

  if (error) {
    console.error('addIssue error:', error.message);
    return { error: `Could not create issue: ${error.message}` };
  }

  revalidatePath('/dashboard/issues');
  revalidatePath('/dashboard');
  return { data };
}

const updateIssueSchema = issueSchema.extend({
  id: z.string(),
});

export async function updateIssue(formData: z.infer<typeof updateIssueSchema>) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const parsedData = updateIssueSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: `Invalid form data: ${parsedData.error.message}` };
    }
    
    const { id, ...issueData } = parsedData.data;

    const { data, error } = await supabase
        .from('issues')
        .update({
            title: issueData.title,
            project_id: issueData.project_id,
            status: issueData.status,
            priority: issueData.priority,
            assignee_id: issueData.assignee_id === 'null' ? null : issueData.assignee_id,
        })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Supabase update error:', error);
        return { error: `Failed to update issue: ${error.message}` };
    }
    
    revalidatePath('/dashboard/issues');
    revalidatePath('/dashboard');
    return { data };
}
