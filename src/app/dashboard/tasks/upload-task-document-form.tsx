'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addMultipleTasks } from './actions';
import { useRouter } from 'next/navigation';
import type { ExtractedTask } from '@/ai/flows/extract-task-details-from-document';
import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.min.mjs';

const uploadSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'File is required.'),
});

function parseTaskDocument(content: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const taskBlocks = content.split('---').map(block => block.trim()).filter(Boolean);

  for (const block of taskBlocks) {
    const titleMatch = block.match(/# Task:\s*(.*)/);
    const priorityMatch = block.match(/\*\*Priority:\*\*\s*(High|Medium|Low)/i);
    const statusMatch = block.match(/\*\*Status:\*\*\s*(Waiting for Approval|Backlog|In Progress|Blocked|Done)/i);
    const dueDateMatch = block.match(/\*\*Due Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    const descriptionMatch = block.match(/\*\*Description:\*\*\s*([\s\S]*)/);
    
    if (titleMatch) {
      tasks.push({
        title: titleMatch[1].trim(),
        priority: (priorityMatch ? priorityMatch[1] : 'Medium') as "High" | "Medium" | "Low",
        status: (statusMatch ? statusMatch[1] : 'Backlog') as "Waiting for Approval" | "Backlog" | "In Progress" | "Blocked" | "Done",
        due_date: dueDateMatch ? dueDateMatch[1] : undefined,
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
      });
    }
  }
  return tasks;
}

async function getPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Naive text reconstruction with line breaks
        let lastY = -1;
        let pageText = '';
        for (const item of textContent.items) {
            if (lastY !== -1 && item.transform[5] < lastY) {
                pageText += '\n';
            }
            pageText += item.str;
            lastY = item.transform[5];
        }
        fullText += pageText + '\n';
    }
    return fullText;
}


export function UploadTaskDocumentForm({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setIsProcessing(true);
    try {
      const file = values.file[0];
      let fileContent = '';

      if (file.type === 'application/pdf') {
          fileContent = await getPdfText(file);
      } else {
          fileContent = await file.text();
      }

      // 1. Parse tasks using the client-side parser
      const extractedTasks = parseTaskDocument(fileContent);

      if (!extractedTasks || extractedTasks.length === 0) {
        throw new Error('Could not find any valid tasks in the document. Please check the formatting.');
      }

      // 2. Add all tasks to the database directly
      const result = await addMultipleTasks(extractedTasks, projectId);

       if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Tasks Added Successfully',
        description: `${result.data?.length || 0} tasks have been automatically created from the document.`,
      });
      
      setOpen(false);
      form.reset();
      router.refresh();

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error processing document',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Upload Task Document
            </DialogTitle>
            <DialogDescription>
              Select a document (.txt, .md, .pdf) to automatically create tasks based on a template.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document</FormLabel>
                    <FormControl>
                      <Input type="file" {...form.register('file')} accept=".txt,.md,.pdf" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Process and Add Tasks'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
