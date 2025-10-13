'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

  let query = supabase.from('documents').select(`
    *,
    user:modified_by ( id, full_name )
  `);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('last_modified', { ascending: false });

  if (error) {
    console.error('getDocuments error:', error.message);
    return { data: null, error: `Could not fetch documents: ${error.message}` };
  }

  const formattedData = data.map(doc => ({
    ...doc,
    modifiedBy: doc.user?.full_name || 'Unknown',
    lastModified: new Date(doc.last_modified).toLocaleDateString(),
  }));

  return { data: formattedData, error: null };
}