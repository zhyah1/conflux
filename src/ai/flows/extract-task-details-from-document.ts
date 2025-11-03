'use server';
/**
 * @fileOverview A Genkit flow to extract structured task details from a document.
 *
 * This flow analyzes a document's content and returns a structured object
 * containing task details like title, priority, description, and status.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ExtractedTaskDetailsSchema = z.object({
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
export type ExtractedTaskDetails = z.infer<typeof ExtractedTaskDetailsSchema>;

const ExtractTaskInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document content as a data URI, including MIME type and Base64 encoding. e.g., 'data:application/pdf;base64,<data>'"
    ),
});

export async function extractTaskDetailsFromDocument(
  documentDataUri: string
): Promise<ExtractedTaskDetails> {
  return extractTaskDetailsFlow({ documentDataUri });
}

const prompt = ai.definePrompt({
  name: 'extractTaskDetailsPrompt',
  input: { schema: ExtractTaskInputSchema },
  output: { schema: ExtractedTaskDetailsSchema },
  prompt: `You are a project management assistant. Analyze the following document and extract the task details.

  Document Content:
  {{media url=documentDataUri}}

  Based on the document, provide the task's title, priority, status, a detailed description, and a due date if mentioned.
  The priority should be one of "High", "Medium", or "Low".
  The status should be one of "Waiting for Approval", "Backlog", "In Progress", "Blocked", or "Done".
  If a due date is present, format it as YYYY-MM-DD.

  Return the data in a valid JSON format.
  `,
});

const extractTaskDetailsFlow = ai.defineFlow(
  {
    name: 'extractTaskDetailsFlow',
    inputSchema: ExtractTaskInputSchema,
    outputSchema: ExtractedTaskDetailsSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
