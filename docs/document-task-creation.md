### Template-Based Task Creation from Documents

This document outlines the workflow for the "Upload Task Document" feature, which uses a deterministic parser to automate the creation of multiple tasks from a single structured document. This process does not use AI.

#### How It Works: The Step-by-Step Process

The entire process, from file upload to task creation, is designed to be seamless and requires no manual data entry after the initial document upload.

1.  **Initiating the Upload**:
    *   On the project's task board, the user clicks the **"Upload Task Doc"** button.
    *   This action opens a dialog controlled by the `UploadTaskDocumentForm` component.

2.  **Document Processing on the Frontend**:
    *   The user selects a supported document (`.md`, `.txt`, `.pdf`, or `.xlsx`).
    *   When the "Process and Add Tasks" button is clicked, the browser reads the file's content directly. 
        * For PDF files, it uses the `pdf.js` library to extract the text.
        * For Excel files, it uses the `xlsx` library to parse the sheet.

3.  **Client-Side Data Extraction**:
    *   A parser function on the client-side analyzes the document's content.
    *   For text-based files, it first splits the document into separate "task blocks" using a `---` horizontal rule as a separator.
    *   For each block (or for each row in an Excel file), it finds and extracts key details for `title`, `priority`, `status`, `description`, and `due_date`.
    *   This information is compiled into a structured **JSON array**, where each object in the array represents a single task.

4.  **Automated Database Insertion**:
    *   The frontend sends the generated JSON array of tasks to a server action called `addMultipleTasks`.
    *   This action takes the entire array of task objects and, in a single efficient operation, inserts them as new rows into the `tasks` table in your database. This happens automatically without any need for user review or confirmation.

5.  **Confirmation and UI Update**:
    *   After the tasks are successfully saved to the database, the upload dialog closes.
    *   A toast notification appears, confirming the number of tasks that were successfully created (e.g., "3 tasks have been automatically created from the document.").
    *   The task board then automatically refreshes to display the newly created tasks in their respective columns.

#### Document Formatting Guidelines

##### Text or Markdown (`.txt`, `.md`, `.pdf`)

For the parser to work correctly, your document **must** be structured clearly. Use headings and markdown formatting to separate tasks and their details. The parser is built to recognize patterns exactly like the one in `docs/sample-task-document.md`.

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

##### Excel (`.xlsx`, `.xls`)

For Excel files, the structure is based on columns. The parser expects the **first row to be a header row**, which will be skipped. The subsequent rows should contain the task data. The parser expects the columns to be in the following order:

1.  **title**
2.  **priority**
3.  **status**
4.  **description**
5.  **due_date** (formatted as YYYY-MM-DD)
6.  **assignee_email** (the email of the user to assign the task to)

| title                        | priority | status      | description                                     | due_date   | assignee_email       |
| ---------------------------- | -------- | ----------- | ----------------------------------------------- | ---------- | -------------------- |
| Urgent - Fix Lobby Plumbing  | High     | Backlog     | Significant water leak reported in the lobby.   | 2024-12-15 | contractor@example.com |
| Procure HVAC Units           | Medium   | Backlog     | Source and procure 12 HVAC units.               | 2025-01-20 | pmc@example.com      |
| Draft initial project charter| Low      | In Progress | Create the initial draft of the project charter.|            |                      |
