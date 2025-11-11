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
import * as pdfjs from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set the worker source for pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type ExtractedTask = {
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Waiting for Approval' | 'Backlog' | 'In Progress' | 'Blocked' | 'Done';
  due_date?: string;
  description?: string;
  assignee_email?: string;
};

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
        
        let lastY = -1;
        let pageText = '';
        textContent.items.forEach(item => {
            if ('str' in item) {
                if (lastY !== -1 && item.transform[5] < lastY - 5) { // Threshold for new line
                    pageText += '\n';
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
            }
        });
        fullText += pageText.replace(/\s+/g, ' ').trim() + '\n';
    }
    return fullText;
}

async function getExcelTasks(file: File): Promise<ExtractedTask[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, {
    header: ['title', 'priority', 'status', 'description', 'due_date', 'assignee_email'],
    range: 1, // Skip header row
    raw: false, // This ensures dates are formatted as strings
    dateNF: 'yyyy-mm-dd', // Specify the date format
  }) as any[];
  
  return json.map(row => ({
    title: row.title || '',
    priority: row.priority || 'Medium',
    status: row.status || 'Backlog',
    description: row.description || '',
    due_date: row.due_date,
    assignee_email: row.assignee_email || undefined,
  }));
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
      let extractedTasks: ExtractedTask[] = [];

      if (file.type === 'application/pdf') {
          const fileContent = await getPdfText(file);
          extractedTasks = parseTaskDocument(fileContent);
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
          extractedTasks = await getExcelTasks(file);
      } else {
          const fileContent = await file.text();
          extractedTasks = parseTaskDocument(fileContent);
      }

      if (!extractedTasks || extractedTasks.length === 0) {
        throw new Error('Could not find any valid tasks in the document. Please check the formatting.');
      }

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
              Select a document (.txt, .md, .pdf, .xlsx, .xls) to automatically create tasks based on a template.
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
                      <Input type="file" {...form.register('file')} accept=".txt,.md,.pdf,.xlsx,.xls" />
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
