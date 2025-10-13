'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function getIssues(projectId?: string) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  let query = supabase.from('issues').select(`
    id,
    title,
    status,
    priority,
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

  const { data, error } = await supabase
    .from('issues')
    .insert([{ ...parsedData.data, created_by: user.id }])
    .select();

  if (error) {
    console.error('addIssue error:', error.message);
    return { error: `Could not create issue: ${error.message}` };
  }

  revalidatePath('/dashboard/issues');
  return { data };
}
