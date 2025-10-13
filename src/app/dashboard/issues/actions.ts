'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function getIssues(projectId?: string) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  let query = supabase.from('issues').select(`
    *,
    assignee:assignee_id ( id, full_name ),
    project:project_id ( id, name )
  `);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('getIssues error:', error.message);
    return { data: null, error: `Could not fetch issues: ${error.message}` };
  }
  
  const formattedData = data.map(issue => ({
    ...issue,
    assignee: issue.assignee?.full_name || 'Unassigned',
    project: issue.project?.name || 'Unknown Project'
  }));

  return { data: formattedData, error: null };
}