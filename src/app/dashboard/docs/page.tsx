
'use client';

import { PageHeader } from '../components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const roleSystemMd = `
# Role-Based Access Control (RBAC) System

This document outlines the user roles and permissions system for the Construx project management application. The system is designed to provide granular control over data access and actions, ensuring team members only have access to the information and functionality relevant to their responsibilities.

## 1. Overview of Roles

There are seven predefined roles in the system, ordered here from most to least privileged:

1.  **Owner**: The account creator or top-level stakeholder. Has unrestricted super-administrator privileges.
2.  **Admin**: A user with full administrative access, nearly identical to the Owner. Can manage all aspects of the application.
3.  **PMC (Project Management Consultancy)**: Manages master projects. Can create sub-projects (phases) and assign Contractors to them.
4.  **Contractor**: Manages the execution of a project or sub-project. Can assign tasks to Subcontractors and themselves.
5.  **Consultant**: Same as contractor. Manages the execution of a project or sub-project. Can assign tasks to Subcontractors and themselves.
6.  **Subcontractor**: A specialized worker or team responsible for executing specific tasks within a project.
7.  **Client**: A stakeholder with read-only access to view the progress of projects they are assigned to.

## 2. Permission Matrix

<table class="w-full">
    <thead>
        <tr>
            <th class="text-left">Feature</th>
            <th class="text-center">Owner / Admin</th>
            <th class="text-center">PMC</th>
            <th class="text-center">Contractor / Consultant</th>
            <th class="text-center">Subcontractor</th>
            <th class="text-center">Client</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td colspan="6" class="font-bold pt-4">User Management</td>
        </tr>
        <tr>
            <td>Invite Users</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>Assign Roles</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>View All Users</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td colspan="6" class="font-bold pt-4">Project Mgmt.</td>
        </tr>
        <tr>
            <td>Create Master Project</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>Create Sub-Project</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>View All Projects</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>View Assigned Only</td>
            <td class="text-center">N/A</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
        </tr>
        <tr>
            <td>Edit Any Project</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>Edit Assigned Only</td>
            <td class="text-center">N/A</td>
            <td class="text-center">✅ (Can assign users)</td>
            <td class="text-center">✅ (Can assign users)</td>
            <td class="text-center">✅ (Status/Progress)</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>Delete Projects</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td colspan="6" class="font-bold pt-4">Task Management</td>
        </tr>
        <tr>
            <td>View Tasks (Assigned Project)</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅ (Read-only)</td>
        </tr>
        <tr>
            <td>Create Tasks</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>Edit Any Task</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅ (If assigned)</td>
            <td class="text-center">✅ (If assigned)</td>
            <td class="text-center">❌</td>
        </tr>
        <tr>
            <td>Assign Tasks To...</td>
            <td class="text-center">Any</td>
            <td class="text-center">Contractors, Subcontractors</td>
            <td class="text-center">Self, Subcontractors</td>
            <td class="text-center">Self</td>
            <td class="text-center">N/A</td>
        </tr>
        <tr>
            <td>Delete Tasks</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅ (If assigned)</td>
            <td class="text-center">✅ (If assigned)</td>
            <td class="text-center">❌</td>
        </tr>
    </tbody>
</table>

---

## 3. Detailed Role Breakdown

### Owner / Admin

Owners and Admins have full, unrestricted access to the entire system. They are the only roles that can manage users and have visibility across all projects.

-   **Project Management**: Can create, view, edit, and delete any project or sub-project. They can assign any user to any project.
-   **User Management**: The only roles capable of inviting new users and assigning their roles.
-   **Task Management**: Have full CRUD (Create, Read, Update, Delete) permissions on all tasks in all projects.

### PMC (Project Management Consultancy)

PMCs act as high-level managers for master projects. They are responsible for structuring the project by creating sub-phases and delegating work to Contractors.

-   **Project Management**: Can create sub-projects (phases) under a master project they are assigned to. They cannot create new master projects. They can edit the projects they manage, primarily to assign or un-assign Contractors.
-   **Task Management**: Can create, edit, and delete tasks within the projects they oversee. They can assign tasks to Contractors and Subcontractors.

### Contractor & Consultant

Contractors and Consultants are responsible for the day-to-day execution of a project or a specific sub-phase. They manage their own work and delegate specific tasks to Subcontractors.

-   **Project Management**: Can view details of projects they are assigned to. They can edit the project to update its status or progress, but cannot change core details like budget or timeline. They can assign Subcontractors to projects they manage.
-   **Task Management**: Can create new tasks within their assigned projects. They can assign tasks to themselves or to any Subcontractor on the project team. They can edit and update the status of tasks they are assigned to.

### Subcontractor

Subcontractors are the specialists who perform the hands-on work. Their access is focused on the specific tasks assigned to them.

-   **Project Management**: Have read-only access to the projects they are assigned to. They can update their task progress, which rolls up to the overall project completion.
-   **Task Management**: Can view all tasks within a project they are on but can only edit tasks assigned directly to them (e.g., changing status from "In Progress" to "Done"). When creating tasks, they can only assign those tasks to themselves.

### Client

Clients are external or internal stakeholders who need to monitor project progress without having editing capabilities.

-   **Project Management**: Have read-only access to view the details, status, and progress of projects they have been granted access to.
-   **Task Management**: Have read-only access to view tasks within their assigned projects but cannot make any changes.
`;

const architectureAndDatabaseMd = `
# System Architecture and Database Overview

This document provides a high-level overview of the technical architecture, database schema, and core data flows of the Construx application.

## 1. Technology Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth)
- **Data Fetching/Mutations**: Next.js Server Actions
- **State Management**: React Context (\`UserProvider\`) and component-level state (\`useState\`, \`useEffect\`).

## 2. Database Schema (Supabase)

The core of the application revolves around a relational database schema managed by Supabase. Row-Level Security (RLS) is used to control data access, but most data fetching for read operations is performed via a server-side admin client to simplify data aggregation for dashboards and reports. Write operations (create, update, delete) are performed through Server Actions, which respect user permissions.

### Core Tables

#### \`users\`
This table stores profile information for each user and is linked to the \`auth.users\` table provided by Supabase Auth.

| Column       | Type      | Description                                                 |
|--------------|-----------|-------------------------------------------------------------|
| \`id\`         | \`uuid\`    | Primary Key. Foreign key to \`auth.users.id\`.                |
| \`full_name\`  | \`text\`    | The user's full name.                                       |
| \`email\`      | \`text\`    | The user's email address.                                   |
| \`role\`       | \`text\`    | The user's assigned role (e.g., \`admin\`, \`pmc\`, \`consultant\`, \`client\`).   |
| \`avatar_url\` | \`text\`    | A URL to the user's profile picture.                        |

#### \`projects\`
This table holds all master projects and their sub-projects (phases). It features a self-referencing relationship to create a hierarchy.

| Column          | Type          | Description                                                    |
|-----------------|---------------|----------------------------------------------------------------|
| \`id\`            | \`text\`        | Primary Key. Custom format (e.g., \`PROJ-17123456\`).            |
| \`name\`          | \`text\`        | The name of the project or sub-phase.                          |
| \`status\`        | \`text\`        | Current status (e.g., \`Planning\`, \`On Track\`, \`Delayed\`).      |
| \`owner\`         | \`text\`        | The client or owning entity of the project.                    |
| \`budget\`        | \`numeric\`     | The total budget allocated for the project.                    |
| \`completion\`    | \`numeric\`     | The completion percentage (0-100).                             |
| \`start_date\`    | \`timestamptz\` | The planned start date of the project.                         |
| \`end_date\`      | \`timestamptz\` | The planned end date of the project.                           |
| \`parent_id\`     | \`text\`        | Foreign key to \`projects.id\`. \`NULL\` for master projects.      |
| \`phase_order\`   | \`integer\`     | The display order for sub-projects within a master project.    |

#### \`tasks\`
This table contains all individual tasks, linked to a specific project.

| Column         | Type          | Description                                                    |
|----------------|---------------|----------------------------------------------------------------|
| \`id\`           | \`text\`        | Primary Key. Custom format (e.g., \`TASK-17123456\`).            |
| \`title\`        | \`text\`        | The title of the task.                                         |
| \`status\`       | \`text\`        | Current status (e.g., \`Backlog\`, \`In Progress\`, \`Done\`).       |
| \`priority\`     | \`text\`        | Priority level (\`High\`, \`Medium\`, \`Low\`).                      |
| \`project_id\`   | \`text\`        | Foreign key to \`projects.id\`. **Required**.                    |
| \`assignee_id\`  | \`uuid\`        | Foreign key to \`users.id\`. The user responsible for the task.  |
| \`approver_id\`  | \`uuid\`        | Foreign key to \`users.id\`. Required approver for the task.     |
| \`created_by\`   | \`uuid\`        | Foreign key to \`users.id\`. The user who created the task.      |
| \`description\`  | \`text\`        | A detailed description of the task.                            |
| \`due_date\`     | \`timestamptz\` | The deadline for the task.                                     |
| \`progress\`     | \`numeric\`     | The completion percentage (0-100).                             |

### Junction and Logging Tables

#### \`project_users\`
A many-to-many junction table linking users to the projects they are assigned to.

| Column       | Type   | Description                       |
|--------------|--------|-----------------------------------|
| \`project_id\` | \`text\` | Foreign key to \`projects.id\`.     |
| \`user_id\`    | \`uuid\` | Foreign key to \`users.id\`.        |

#### \`task_approvals\`
Logs the history of approval requests for tasks.

| Column          | Type          | Description                                                            |
|-----------------|---------------|------------------------------------------------------------------------|
| \`id\`            | \`bigint\`      | Primary Key.                                                           |
| \`task_id\`       | \`text\`        | Foreign key to \`tasks.id\`.                                             |
| \`requested_by_id\`| \`uuid\`        | Foreign key to \`users.id\`. The user who requested approval.            |
| \`approver_id\`   | \`uuid\`        | Foreign key to \`users.id\`. The user who needs to approve.                |
| \`status\`        | \`text\`        | The outcome (\`pending\`, \`approved\`, \`rejected\`).                       |
| \`message\`       | \`text\`        | An optional message with the request.                                  |

#### \`documents\` & \`task_attachments\`
These tables store metadata about files uploaded to Supabase Storage. The actual files are not in the database.

- **\`documents\`**: For project-level documents. Linked to \`projects.id\`.
- **\`task_attachments\`**: For task-specific files. Linked to \`tasks.id\`.

| Column          | Type          | Description                                                    |
|-----------------|---------------|----------------------------------------------------------------|
| \`id\`            | \`uuid\`        | Primary Key.                                                   |
| \`name\`          | \`text\`        | The original name of the uploaded file.                        |
| \`file_path\`     | \`text\`        | The path to the file in Supabase Storage.                      |
| \`project_id\`    | \`text\`        | Foreign key to \`projects.id\`. (For \`documents\` table)          |
| \`task_id\`       | \`text\`        | Foreign key to \`tasks.id\`. (For \`task_attachments\` table)      |
| \`modified_by\` / \`uploaded_by\` | \`uuid\` | Foreign key to \`users.id\`. The user who uploaded the file. |


## 3. Core Data Flow & Permissions

### Role-Based Access Control (RBAC)
User permissions are primarily determined by the \`role\` column in the \`users\` table. The logic for what a user can see or do is enforced in two places:
1.  **Frontend UI**: Components conditionally render buttons and forms based on the user's role (e.g., only an \`admin\` sees the "Invite User" button). This is managed via the \`useUser\` hook.
2.  **Backend Server Actions**: Before any database mutation (create, update, delete), the server action checks the user's role to ensure they have the necessary permissions. For example, \`addProject\` action verifies if the user is an \`admin\` or \`pmc\`.

### Data Fetching
- Most pages fetch data using \`useEffect\` hooks that call Server Actions (e.g., \`getProjects\`, \`getTasksByProjectId\`).
- These read operations are typically performed with a Supabase admin client to bypass RLS for simplicity, as the frontend logic already filters what the user is allowed to see. The user's specific project assignments are checked for views like the main projects list.

### Automated Task Creation from Documents
The document upload feature follows a deterministic, template-based process for bulk task creation. This process is handled entirely on the client-side and does not use any AI.

1.  **File Upload**: A user uploads a supported file (\`.txt\`, \`.md\`, \`.pdf\`, or \`.xlsx\`) from the task board.
2.  **Client-Side Parsing**:
    - **For Text/Markdown/PDF**: The frontend reads the file content. For PDFs, the \`pdf.js\` library extracts the raw text while preserving line breaks. The parser then splits the content into blocks using \`---\` as a separator and extracts key-value pairs (e.g., \`**Priority:** High\`) to build task objects.
    - **For Excel**: The \`xlsx\` library parses the spreadsheet. It expects a specific column order (\`title\`, \`priority\`, \`status\`, \`description\`, \`due_date\`, \`assignee_email\`) and converts each row after the header into a task object.
3.  **Server Action**: The resulting array of structured task objects is sent to the \`addMultipleTasks\` server action.
4.  **Database Insertion**: The server action performs a bulk \`insert\` operation into the \`tasks\` table. If an \`assignee_email\` was provided in an Excel file, the action looks up the corresponding user's ID before inserting the task, automatically assigning it.

This architecture balances the reactive nature of a modern frontend with the security and power of server-side logic, using Supabase as a flexible and scalable backend.
`;

const documentTaskCreationMd = `
### Template-Based Task Creation from Documents

This document outlines the workflow for the "Upload Task Document" feature, which uses a deterministic parser to automate the creation of multiple tasks from a single structured document. This process does not use AI.

#### How It Works: The Step-by-Step Process

The entire process, from file upload to task creation, is designed to be seamless and requires no manual data entry after the initial document upload.

1.  **Initiating the Upload**:
    *   On the project's task board, the user clicks the **"Upload Task Doc"** button.
    *   This action opens a dialog controlled by the \`UploadTaskDocumentForm\` component.

2.  **Document Processing on the Frontend**:
    *   The user selects a supported document (\`.md\`, \`.txt\`, \`.pdf\`, or \`.xlsx\`).
    *   When the "Process and Add Tasks" button is clicked, the browser reads the file's content directly. 
        * For PDF files, it uses the \`pdf.js\` library to extract the text.
        * For Excel files, it uses the \`xlsx\` library to parse the sheet.

3.  **Client-Side Data Extraction**:
    *   A parser function on the client-side analyzes the document's content.
    *   For text-based files, it first splits the document into separate "task blocks" using a \`---\` horizontal rule as a separator.
    *   For each block (or for each row in an Excel file), it finds and extracts key details for \`title\`, \`priority\`, \`status\`, \`description\`, and \`due_date\`.
    *   This information is compiled into a structured **JSON array**, where each object in the array represents a single task.

4.  **Automated Database Insertion**:
    *   The frontend sends the generated JSON array of tasks to a server action called \`addMultipleTasks\`.
    *   This action takes the entire array of task objects and, in a single efficient operation, inserts them as new rows into the \`tasks\` table in your database. This happens automatically without any need for user review or confirmation.

5.  **Confirmation and UI Update**:
    *   After the tasks are successfully saved to the database, the upload dialog closes.
    *   A toast notification appears, confirming the number of tasks that were successfully created (e.g., "3 tasks have been automatically created from the document.").
    *   The task board then automatically refreshes to display the newly created tasks in their respective columns.

#### Document Formatting Guidelines

##### Text or Markdown (\`.txt\`, \`.md\`, \`.pdf\`)

For the parser to work correctly, your document **must** be structured clearly. Use headings and markdown formatting to separate tasks and their details. The parser is built to recognize patterns exactly like the one in \`docs/sample-task-document.md\`.

**Example of a single task block:**

\`\`\`markdown
# Task: [Your Task Title]

**Priority:** High | Medium | Low
**Status:** Backlog | In Progress | Done
**Due Date:** YYYY-MM-DD

**Description:**

A clear and detailed description of what needs to be done for this task.
\`\`\`

You can stack multiple task blocks like the one above in a single file, separated by a horizontal rule (\`---\`), to add multiple tasks at once.

##### Excel (\`.xlsx\`, \`.xls\`)

For Excel files, the structure is based on columns. The parser expects the **first row to be a header row**, which will be skipped. The subsequent rows should contain the task data. The parser expects the columns to be in the following order:

1.  **title**
2.  **priority**
3.  **status**
4.  **description**
5.  **due_date** (formatted as YYYY-MM-DD)
6.  **assignee_email** (the email of the user to assign the task to)

| title                        | priority | status      | description                                     | due_date   | assignee_email       |
| ---------------------------- | -------- | ----------- | ----------------------------------------------- | ---------- | -------------------- |
| Urgent - Fix Lobby Plumbing  | High     | Backlog     | Significant water leak reported in the lobby.   | 2024-12-15 | consultant@example.com |
| Procure HVAC Units           | Medium   | Backlog     | Source and procure 12 HVAC units.               | 2025-01-20 | pmc@example.com      |
| Draft initial project charter| Low      | In Progress | Create the initial draft of the project charter.|            |                      |
`;

const sampleTaskDocumentMd = `
# Task: Urgent - Fix Lobby Plumbing

**Priority:** High
**Status:** Backlog
**Due Date:** 2024-12-15

**Description:**

There is a significant water leak reported in the main lobby near the reception desk. This needs to be addressed immediately to prevent further water damage to the flooring and surrounding structures.

The assigned team needs to:
1.  Inspect the source of the leak.
2.  Shut off the main water valve for the lobby area.
3.  Repair or replace the faulty pipe section.
4.  Test the repair thoroughly.
5.  Clean up the area and report on the completion.

---

# Task: Procure HVAC Units for 5th Floor

**Priority:** Medium
**Status:** Backlog
**Due Date:** 2025-01-20

**Description:**

Source and procure 12 high-efficiency HVAC units for the entire 5th floor renovation. All units must meet the project's energy efficiency and size specifications. Obtain at least three quotes from approved vendors before finalizing the purchase.

---

# Task: Draft initial project charter

**Priority:** Low
**Status:** In Progress

**Description:**

Create the initial draft of the project charter for the "West Wing Renovation" project. The document should include project goals, stakeholders, budget outline, and high-level timeline. This is a preliminary document for internal review.
`;


// This is a simple Markdown-to-HTML converter that supports headings, bold, lists, and tables.
function markdownToHtml(md: string) {
    md = md.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    md = md.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    md = md.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    md = md.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    md = md.replace(/`([^`]+)`/gim, '<code>$1</code>');
    md = md.replace(/^(?!\<table)(-\s+.*$)/gim, '<li>$1</li>');
    md = md.replace(/<\/li><li>/gim, '</li>\n<li>'); // Add newline between li
    md = md.replace(/^(?!\<table)(1\.\s+.*$)/gim, '<li>$1</li>');

    // Handle paragraphs and lists
    md = md.split('\n').map(line => {
        if (line.trim().startsWith('<table')) return line;
        return line.trim() === '' ? '' : `<p>${line}</p>`;
    }).join('');

    md = md.replace(/<p><h1>/g, '<h1>').replace(/<\/h1><\/p>/g, '</h1>');
    md = md.replace(/<p><h2>/g, '<h2>').replace(/<\/h2><\/p>/g, '</h2>');
    md = md.replace(/<p><h3>/g, '<h3>').replace(/<\/h3><\/p>/g, '</h3>');
    md = md.replace(/<p><li>/g, '<li>').replace(/<\/li><\/p>/g, '</li>');
    md = md.replace(/(<li>.+<\/li>)+/g, '<ul>$&</ul>');
    md = md.replace(/<\/ul><ul>/g, '');
    md = md.replace(/<p>---<\/p>/g, '<hr class="my-4"/>');

    return md;
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documentation"
        description="System architecture, database schema, and feature guides."
      />
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="role-system">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="role-system">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="task-creation">Task Creation</TabsTrigger>
              <TabsTrigger value="sample-doc">Sample Document</TabsTrigger>
            </TabsList>
            <TabsContent value="role-system">
              <Card>
                <CardHeader>
                  <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
                  <CardDescription>
                    User roles and permissions system for the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(roleSystemMd) }} />
              </Card>
            </TabsContent>
            <TabsContent value="architecture">
              <Card>
                <CardHeader>
                  <CardTitle>System Architecture and Database</CardTitle>
                  <CardDescription>
                    High-level overview of the technical architecture and database schema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(architectureAndDatabaseMd) }} />
              </Card>
            </TabsContent>
            <TabsContent value="task-creation">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Task Creation from Documents</CardTitle>
                  <CardDescription>
                    Workflow for the deterministic parser that automates task creation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(documentTaskCreationMd) }}/>
              </Card>
            </TabsContent>
            <TabsContent value="sample-doc">
              <Card>
                <CardHeader>
                  <CardTitle>Sample Task Document</CardTitle>
                  <CardDescription>
                    An example of a correctly formatted document for task creation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(sampleTaskDocumentMd) }}/>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
