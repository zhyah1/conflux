
# Role-Based Access Control (RBAC) System

This document outlines the user roles and permissions system for the Construx project management application. The system is designed to provide granular control over data access and actions, ensuring team members only have access to the information and functionality relevant to their responsibilities.

## 1. Overview of Roles

There are six predefined roles in the system, ordered here from most to least privileged:

1.  **Owner**: The account creator or top-level stakeholder. Has unrestricted super-administrator privileges.
2.  **Admin**: A user with full administrative access, nearly identical to the Owner. Can manage all aspects of the application.
3.  **PMC (Project Management Consultancy)**: Manages master projects. Can create sub-projects (phases) and assign Contractors to them.
4.  **Contractor**: Manages the execution of a project or sub-project. This general role includes specific disciplines such as **Landscape consultant**, **MEP consultant**, and **Interior design Consultant**. They can assign tasks to Subcontractors and themselves.
5.  **Subcontractor**: A specialized worker or team responsible for executing specific tasks within a project.
6.  **Client**: A stakeholder with read-only access to view the progress of projects they are assigned to.

## 2. Permission Matrix

The following table summarizes the key permissions for each role.

| Feature             | Owner / Admin | PMC                      | Contractor & Consultants | Subcontractor            | Client               |
| ------------------- | :-----------: | :----------------------: | :----------------------: | :----------------------: | :------------------: |
| **User Management** |               |                          |                          |                          |                      |
| Invite Users        |      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| Assign Roles        |      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| View All Users      |      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| **Project Mgmt.**   |               |                          |                          |                          |                      |
| Create Master Project|      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| Create Sub-Project  |      ✅       |            ✅            |            ❌            |            ❌            |          ❌          |
| View All Projects   |      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| View Assigned Only  |      N/A      |            ✅            |            ✅            |            ✅            |          ✅          |
| Edit Any Project    |      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| Edit Assigned Only  |      N/A      | ✅ (Can assign users)    | ✅ (Can assign users)    | ✅ (Status/Progress)     |          ❌          |
| Delete Projects     |      ✅       |            ❌            |            ❌            |            ❌            |          ❌          |
| **Task Management** |               |                          |                          |                          |                      |
| View Tasks (Assigned Project) |      ✅       | ✅                       | ✅                       | ✅                       | ✅ (Read-only)      |
| Create Tasks        |      ✅       | ✅                       | ✅                       | ✅                       |          ❌          |
| Edit Any Task       |      ✅       | ✅                       | ✅ (If assigned)         | ✅ (If assigned)         |          ❌          |
| Assign Tasks To...  |      Any      | Contractors, Subcontractors | Self, Subcontractors     | Self                     |          N/A         |
| Delete Tasks        |      ✅       | ✅                       | ✅ (If assigned)         | ✅ (If assigned)         |          ❌          |

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

### Contractor & Consultants

Contractors and specialized consultants (**Landscape, MEP, Interior Design**) are responsible for the day-to-day execution of a project or a specific sub-phase. They manage their own work and delegate specific tasks to Subcontractors.

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
