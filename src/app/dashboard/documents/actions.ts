'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

async function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Schema for creating a document record in the database
const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required.'),
  project_id: z.string().min(1, 'Project ID is required.'),
  file_path: z.string().min(1, 'File path is required.'),
});

export async function addDocument(formData: z.infer<typeof documentSchema>) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedData = documentSchema.safeParse(formData);
  if (!parsedData.success) {
    return { error: `Invalid form data: ${parsedData.error.message}` };
  }

  const { name, project_id, file_path } = parsedData.data;

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      name,
      project_id,
      file_path,
      modified_by: user.id,
      version: 1,
      upload_count: 1,
      modification_count: 0,
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating document:', error);
    return { error: `Failed to create document record: ${error.message}` };
  }

  revalidatePath('/dashboard/documents');
  return { data };
}

// Function to upload the actual file to Supabase Storage
export async function uploadDocumentFile(file: File, projectId: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return { path: null, error: `Failed to upload file: ${uploadError.message}` };
    }

    return { path: filePath, error: null };
}

// Function to get documents, optionally filtered by project
export async function getDocuments(projectId?: string) {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const supabaseAdmin = await getAdminSupabase();

  let query = supabaseAdmin.from('documents').select(`
    id,
    name,
    version,
    last_modified,
    upload_count,
    modification_count,
    project_id,
    modified_by
  `);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: documentsData, error } = await query.order('last_modified', { ascending: false });

  if (error) {
    console.error('getDocuments (documents) error:', error.message);
    return { data: null, error: `Could not fetch documents: ${error.message}` };
  }

  if (!documentsData) {
    return { data: [], error: null };
  }

  const userIds = documentsData
    .map(doc => doc.modified_by)
    .filter((id): id is string => id !== null);

  if (userIds.length === 0) {
     const formattedData = documentsData.map(doc => ({
      ...doc,
      modifiedBy: 'Unknown',
      lastModified: new Date(doc.last_modified).toLocaleDateString(),
    }));
    return { data: formattedData, error: null };
  }
  
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .in('id', userIds);
    
  if (usersError) {
    console.error('getDocuments (users) error:', usersError.message);
    return { data: null, error: `Could not fetch document modifiers: ${usersError.message}` };
  }

  const userMap = new Map(usersData.map(u => [u.id, u.full_name]));

  const formattedData = documentsData.map(doc => ({
    ...doc,
    modifiedBy: doc.modified_by ? userMap.get(doc.modified_by) || 'Unknown User' : 'Unknown',
    lastModified: new Date(doc.last_modified).toLocaleDateString(),
  }));


  return { data: formattedData, error: null };
}
