### AI-Powered Task Creation from Documents

This document outlines the workflow for the "Upload Task Document" feature, which uses Generative AI to automate the creation of multiple tasks from a single structured document.

#### How It Works: The Step-by-Step Process

The entire process, from file upload to task creation, is designed to be seamless and requires no manual data entry after the initial document upload.

1.  **Initiating the Upload**:
    *   On the project's task board, the user clicks the **"Upload Task Doc"** button.
    *   This action opens a dialog controlled by the `UploadTaskDocumentForm` component.

2.  **Document Processing on the Frontend**:
    *   The user selects a supported document (e.g., `.md`, `.txt`, `.pdf`).
    *   When the "Process and Add Tasks" button is clicked, the frontend converts the file into a **Base64-encoded Data URI**. This is a standard way to represent a file as a single string of text, which can be easily sent to the backend.

3.  **AI-Powered Data Extraction (The "Magic" Step)**:
    *   The Data URI is sent to a server-side AI flow named `extractTaskDetailsFromDocument`.
    *   This flow is powered by Google's Gemini model via Genkit. It uses a specially crafted prompt that instructs the AI to analyze the document's content.
    *   The prompt is engineered to identify distinct tasks within the document and extract key details for each one: `title`, `priority`, `status`, `description`, and `due_date`.
    *   Crucially, the AI flow is instructed to return this information as a structured **JSON array**, where each object in the array represents a single task.

4.  **Automated Database Insertion**:
    *   Once the frontend receives the JSON array of tasks from the AI flow, it immediately calls another server action: `addMultipleTasks`.
    *   This action takes the entire array of task objects and, in a single efficient operation, inserts them as new rows into the `tasks` table in your Supabase database. This happens automatically without any need for user review or confirmation.

5.  **Confirmation and UI Update**:
    *   After the tasks are successfully saved to the database, the upload dialog closes.
    *   A toast notification appears, confirming the number of tasks that were successfully created (e.g., "3 tasks have been automatically created from the document.").
    *   The task board then automatically refreshes to display the newly created tasks in their respective columns.

#### Document Formatting Guidelines

For best results, your document should be structured clearly. Use headings and markdown formatting to separate tasks and their details. The AI is trained to recognize patterns like the one in `docs/sample-task-document.md`.

**Example of a single task block:**

```markdown
# Task: [Your Task Title]

**Priority:** High | Medium | Low
**Status:** Backlog | In Progress | Done
**Due Date:** YYYY-MM-DD

**Description:**

A clear and detailed description of what needs to be done for this task.
```

You can stack multiple task blocks like the one above in a single file, separated by a horizontal rule (`---`), to add multiple tasks at once.
