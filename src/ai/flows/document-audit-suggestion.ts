'use server';

/**
 * @fileOverview AI-powered document audit suggestion flow.
 *
 * This flow analyzes the number of document uploads or modifications and suggests when a document version or user needs auditing.
 *
 * @file        document-audit-suggestion.ts
 * @exports   documentAuditSuggestion - Function to trigger the document audit suggestion flow.
 * @exports   DocumentAuditSuggestionInput - The input type for the documentAuditSuggestion function.
 * @exports   DocumentAuditSuggestionOutput - The return type for the documentAuditSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentAuditSuggestionInputSchema = z.object({
  documentName: z.string().describe('The name of the document.'),
  versionNumber: z.number().describe('The current version number of the document.'),
  uploadCount: z.number().describe('The number of times the document has been uploaded.'),
  modificationCount: z.number().describe('The number of times the document has been modified.'),
  lastUploadedBy: z.string().describe('The user who last uploaded the document.'),
});

export type DocumentAuditSuggestionInput = z.infer<
  typeof DocumentAuditSuggestionInputSchema
>;

const DocumentAuditSuggestionOutputSchema = z.object({
  auditRecommended: z.boolean().describe('Whether an audit is recommended for the document or user.'),
  reason: z.string().describe('The reason for the audit recommendation.'),
});

export type DocumentAuditSuggestionOutput = z.infer<
  typeof DocumentAuditSuggestionOutputSchema
>;

export async function documentAuditSuggestion(
  input: DocumentAuditSuggestionInput
): Promise<DocumentAuditSuggestionOutput> {
  return documentAuditSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'documentAuditSuggestionPrompt',
  input: {
    schema: DocumentAuditSuggestionInputSchema,
  },
  output: {
    schema: DocumentAuditSuggestionOutputSchema,
  },
  prompt: `You are an AI assistant that analyzes document activity and suggests when an audit is necessary.
  Based on the document's name, version number, upload count, modification count, and the user who last uploaded it, determine if an audit is recommended.

  Document Name: {{{documentName}}}
  Version Number: {{{versionNumber}}}
  Upload Count: {{{uploadCount}}}
  Modification Count: {{{modificationCount}}}
  Last Uploaded By: {{{lastUploadedBy}}}

  Consider these factors to determine if an audit is recommended:
  - A high upload or modification count for a given version may indicate instability or potential issues.
  - Frequent uploads by the same user may indicate a need for closer monitoring or training.

  Return a JSON object indicating whether an audit is recommended and the reason for the recommendation.
  `,
});

const documentAuditSuggestionFlow = ai.defineFlow(
  {
    name: 'documentAuditSuggestionFlow',
    inputSchema: DocumentAuditSuggestionInputSchema,
    outputSchema: DocumentAuditSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
