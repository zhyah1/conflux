import { config } from 'dotenv';
config();

import '@/ai/flows/document-audit-suggestion.ts';
import '@/ai/flows/automatic-delay-escalation.ts';
import '@/ai/flows/extract-task-details-from-document.ts';
