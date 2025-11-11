-- This script enables Row Level Security (RLS) and defines access policies for your application's tables.
-- Run this script in your Supabase SQL Editor to secure your database.
-- It is designed to match the permission logic already present in your application's code and documentation.

-- =============================================================================
-- Helper Function
-- =============================================================================
-- This function retrieves the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- 1. Projects Table
-- =============================================================================

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, to ensure a clean slate
DROP POLICY IF EXISTS "Allow Admins full access" ON public.projects;
DROP POLICY IF EXISTS "Allow assigned users to view" ON public.projects;
DROP POLICY IF EXISTS "Allow PMCs and Contractors to edit assigned projects" ON public.projects;

-- Create Policies for 'projects'
CREATE POLICY "Allow Admins full access"
ON public.projects FOR ALL
USING (get_my_role() = 'admin');

CREATE POLICY "Allow assigned users to view"
ON public.projects FOR SELECT
USING (
  id IN (
    SELECT project_id FROM public.project_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow PMCs and Contractors to edit assigned projects"
ON public.projects FOR UPDATE
USING (
  (get_my_role() IN ('pmc', 'contractor')) AND
  id IN (
    SELECT project_id FROM public.project_users WHERE user_id = auth.uid()
  )
);


-- =============================================================================
-- 2. Tasks Table
-- =============================================================================

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow Admins full access" ON public.tasks;
DROP POLICY IF EXISTS "Allow project members to view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow project members to create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow assigned users to update their tasks" ON public.tasks;

-- Create Policies for 'tasks'
CREATE POLICY "Allow Admins full access"
ON public.tasks FOR ALL
USING (get_my_role() = 'admin');

CREATE POLICY "Allow project members to view tasks"
ON public.tasks FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM public.project_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow project members to create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  (get_my_role() IN ('pmc', 'contractor', 'subcontractor')) AND
  project_id IN (
    SELECT project_id FROM public.project_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Allow assigned users to update their tasks"
ON public.tasks FOR UPDATE
USING (
  (get_my_role() IN ('pmc', 'contractor', 'subcontractor')) AND
  (assignee_id = auth.uid() OR created_by = auth.uid())
);


-- =============================================================================
-- 3. Users Table
-- =============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;

-- Create Policies for 'users'
CREATE POLICY "Allow authenticated users to view all profiles"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own profile"
ON public.users FOR UPDATE
USING (id = auth.uid());


-- =============================================================================
-- 4. Other Tables (Comments, Attachments, etc.)
-- =============================================================================

-- project_users (Junction Table)
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Admins full access" ON public.project_users;
DROP POLICY IF EXISTS "Allow assigned users to see project assignments" ON public.project_users;
CREATE POLICY "Allow Admins full access" ON public.project_users FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Allow assigned users to see project assignments" ON public.project_users FOR SELECT USING (project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid()));


-- project_comments
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow project members to view and add comments" ON public.project_comments;
CREATE POLICY "Allow project members to view and add comments" ON public.project_comments FOR ALL USING (project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid()));

-- task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow project members to view and add task comments" ON public.task_comments;
CREATE POLICY "Allow project members to view and add task comments" ON public.task_comments FOR ALL USING (task_id IN (SELECT id FROM public.tasks WHERE project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())));

-- task_attachments
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow project members to manage task attachments" ON public.task_attachments;
CREATE POLICY "Allow project members to manage task attachments" ON public.task_attachments FOR ALL USING (task_id IN (SELECT id FROM public.tasks WHERE project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())));

-- issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow project members to manage issues" ON public.issues;
CREATE POLICY "Allow project members to manage issues" ON public.issues FOR ALL USING (project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid()));

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow project members to manage documents" ON public.documents;
CREATE POLICY "Allow project members to manage documents" ON public.documents FOR ALL USING (project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid()));

-- task_approvals
ALTER TABLE public.task_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_approvals FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow approvers and requestors to manage approvals" ON public.task_approvals;
CREATE POLICY "Allow approvers and requestors to manage approvals" ON public.task_approvals FOR ALL USING (approver_id = auth.uid() OR requested_by_id = auth.uid());

