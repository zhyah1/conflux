# System Architecture and Database Overview

This document provides a high-level overview of the technical architecture, database schema, and core data flows of the Construx application.

## 1. Technology Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth)
- **Data Fetching/Mutations**: Next.js Server Actions
- **State Management**: React Context (`UserProvider`) and component-level state (`useState`, `useEffect`).

## 2. Database Schema (Supabase)

The core of the application revolves around a relational database schema managed by Supabase. Row-Level Security (RLS) is used to control data access, but most data fetching for read operations is performed via a server-side admin client to simplify data aggregation for dashboards and reports. Write operations (create, update, delete) are performed through Server Actions, which respect user permissions.

### Core Tables

#### `users`
This table stores profile information for each user and is linked to the `auth.users` table provided by Supabase Auth.

| Column       | Type      | Description                                                 |
|--------------|-----------|-------------------------------------------------------------|
| `id`         | `uuid`    | Primary Key. Foreign key to `auth.users.id`.                |
| `full_name`  | `text`    | The user's full name.                                       |
| `email`      | `text`    | The user's email address.                                   |
| `role`       | `text`    | The user's assigned role (e.g., `admin`, `pmc`, `client`).   |
| `avatar_url` | `text`    | A URL to the user's profile picture.                        |

#### `projects`
This table holds all master projects and their sub-projects (phases). It features a self-referencing relationship to create a hierarchy.

| Column          | Type          | Description                                                    |
|-----------------|---------------|----------------------------------------------------------------|
| `id`            | `text`        | Primary Key. Custom format (e.g., `PROJ-17123456`).            |
| `name`          | `text`        | The name of the project or sub-phase.                          |
| `status`        | `text`        | Current status (e.g., `Planning`, `On Track`, `Delayed`).      |
| `owner`         | `text`        | The client or owning entity of the project.                    |
| `budget`        | `numeric`     | The total budget allocated for the project.                    |
| `completion`    | `numeric`     | The completion percentage (0-100).                             |
| `start_date`    | `timestamptz` | The planned start date of the project.                         |
| `end_date`      | `timestamptz` | The planned end date of the project.                           |
| `parent_id`     | `text`        | Foreign key to `projects.id`. `NULL` for master projects.      |
| `phase_order`   | `integer`     | The display order for sub-projects within a master project.    |

#### `tasks`
This table contains all individual tasks, linked to a specific project.

| Column         | Type          | Description                                                    |
|----------------|---------------|----------------------------------------------------------------|
| `id`           | `text`        | Primary Key. Custom format (e.g., `TASK-17123456`).            |
| `title`        | `text`        | The title of the task.                                         |
| `status`       | `text`        | Current status (e.g., `Backlog`, `In Progress`, `Done`).       |
| `priority`     | `text`        | Priority level (`High`, `Medium`, `Low`).                      |
| `project_id`   | `text`        | Foreign key to `projects.id`. **Required**.                    |
| `assignee_id`  | `uuid`        | Foreign key to `users.id`. The user responsible for the task.  |
| `approver_id`  | `uuid`        | Foreign key to `users.id`. Required approver for the task.     |
| `created_by`   | `uuid`        | Foreign key to `users.id`. The user who created the task.      |
| `description`  | `text`        | A detailed description of the task.                            |
| `due_date`     | `timestamptz` | The deadline for the task.                                     |
| `progress`     | `numeric`     | The completion percentage (0-100).                             |

### Junction and Logging Tables

#### `project_users`
A many-to-many junction table linking users to the projects they are assigned to.

| Column       | Type   | Description                       |
|--------------|--------|-----------------------------------|
| `project_id` | `text` | Foreign key to `projects.id`.     |
| `user_id`    | `uuid` | Foreign key to `users.id`.        |

#### `task_approvals`
Logs the history of approval requests for tasks.

| Column          | Type          | Description                                                            |
|-----------------|---------------|------------------------------------------------------------------------|
| `id`            | `bigint`      | Primary Key.                                                           |
| `task_id`       | `text`        | Foreign key to `tasks.id`.                                             |
| `requested_by_id`| `uuid`        | Foreign key to `users.id`. The user who requested approval.            |
| `approver_id`   | `uuid`        | Foreign key to `users.id`. The user who needs to approve.                |
| `status`        | `text`        | The outcome (`pending`, `approved`, `rejected`).                       |
| `message`       | `text`        | An optional message with the request.                                  |

#### `documents` & `task_attachments`
These tables store metadata about files uploaded to Supabase Storage. The actual files are not in the database.

- **`documents`**: For project-level documents. Linked to `projects.id`.
- **`task_attachments`**: For task-specific files. Linked to `tasks.id`.

| Column          | Type          | Description                                                    |
|-----------------|---------------|----------------------------------------------------------------|
| `id`            | `uuid`        | Primary Key.                                                   |
| `name`          | `text`        | The original name of the uploaded file.                        |
| `file_path`     | `text`        | The path to the file in Supabase Storage.                      |
| `project_id`    | `text`        | Foreign key to `projects.id`. (For `documents` table)          |
| `task_id`       | `text`        | Foreign key to `tasks.id`. (For `task_attachments` table)      |
| `modified_by` / `uploaded_by` | `uuid` | Foreign key to `users.id`. The user who uploaded the file. |


## 3. Core Data Flow & Permissions

### Role-Based Access Control (RBAC)
User permissions are primarily determined by the `role` column in the `users` table. The logic for what a user can see or do is enforced in two places:
1.  **Frontend UI**: Components conditionally render buttons and forms based on the user's role (e.g., only an `admin` sees the "Invite User" button). This is managed via the `useUser` hook.
2.  **Backend Server Actions**: Before any database mutation (create, update, delete), the server action checks the user's role to ensure they have the necessary permissions. For example, `addProject` action verifies if the user is an `admin` or `pmc`.

### Data Fetching
- Most pages fetch data using `useEffect` hooks that call Server Actions (e.g., `getProjects`, `getTasksByProjectId`).
- These read operations are typically performed with a Supabase admin client to bypass RLS for simplicity, as the frontend logic already filters what the user is allowed to see. The user's specific project assignments are checked for views like the main projects list.

### Automated Task Creation from Documents
The document upload feature follows a deterministic, template-based process for bulk task creation. This process is handled entirely on the client-side and does not use any AI.

1.  **File Upload**: A user uploads a supported file (`.txt`, `.md`, `.pdf`, or `.xlsx`) from the task board.
2.  **Client-Side Parsing**:
    - **For Text/Markdown/PDF**: The frontend reads the file content. For PDFs, the `pdf.js` library extracts the raw text while preserving line breaks. The parser then splits the content into blocks using `---` as a separator and extracts key-value pairs (e.g., `**Priority:** High`) to build task objects.
    - **For Excel**: The `xlsx` library parses the spreadsheet. It expects a specific column order (`title`, `priority`, `status`, `description`, `due_date`, `assignee_email`) and converts each row after the header into a task object.
3.  **Server Action**: The resulting array of structured task objects is sent to the `addMultipleTasks` server action.
4.  **Database Insertion**: The server action performs a bulk `insert` operation into the `tasks` table. If an `assignee_email` was provided in an Excel file, the action looks up the corresponding user's ID before inserting the task, automatically assigning it.

This architecture balances the reactive nature of a modern frontend with the security and power of server-side logic, using Supabase as a flexible and scalable backend.
