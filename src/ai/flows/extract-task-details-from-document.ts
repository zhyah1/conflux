'use server';
/**
 * @fileOverview A Genkit flow to extract structured task details from a document.
 *
 * This flow analyzes a document's content and returns a structured object
 * containing task details like title, priority, description, and status.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractTaskInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document content as a data URI, including MIME type and Base64 encoding. e.g., 'data:application/pdf;base64,<data>'"
    ),
});

// Define the output schema locally to avoid potential Zod version/instance conflicts.
const SingleTaskSchema = z.object({
  title: z.string().describe('The title of the task.'),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The priority of the task.'),
  status: z
    .enum(['Waiting for Approval', 'Backlog', 'In Progress', 'Blocked', 'Done'])
    .describe('The current status of the task.'),
  description: z.string().describe('A detailed description of the task.'),
  due_date: z
    .string()
    .optional()
    .describe('The due date for the task in YYYY-MM-DD format.'),
});

const ExtractedTaskDetailsOutputSchema = z.array(SingleTaskSchema);

export type ExtractedTask = z.infer<typeof SingleTaskSchema>;
export type ExtractedTasks = z.infer<typeof ExtractedTaskDetailsOutputSchema>;


export async function extractTaskDetailsFromDocument(
  documentDataUri: string
): Promise<ExtractedTasks> {
  return extractTaskDetailsFlow({ documentDataUri });
}

const prompt = ai.definePrompt({
  name: 'extractTaskDetailsPrompt',
  input: { schema: ExtractTaskInputSchema },
  output: { schema: ExtractedTaskDetailsOutputSchema },
  prompt: `You are a project management assistant. Analyze the following document and extract details for ALL tasks found within it.

  Document Content:
  {{media url=documentDataUri}}

  For each task, provide its title, priority, status, a detailed description, and a due date if mentioned.
  The priority must be one of "High", "Medium", or "Low".
  The status must be one of "Waiting for Approval", "Backlog", "In Progress", "Blocked", or "Done".
  If a due date is present, format it as YYYY-MM-DD.

  Return an array of JSON objects, with each object representing a single task. If no tasks are found, return an empty array.
  `,
});

const extractTaskDetailsFlow = ai.defineFlow(
  {
    name: 'extractTaskDetailsFlow',
    inputSchema: ExtractTaskInputSchema,
    outputSchema: ExtractedTaskDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
