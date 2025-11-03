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
import {
  extractTaskDetailsFromDocument,
  type ExtractedTaskDetails,
} from '@/ai/flows/extract-task-details-from-document';
import { AddTaskForm } from './add-task-form';

const uploadSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'File is required.'),
});

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const [extractedData, setExtractedData] =
    useState<ExtractedTaskDetails | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setIsProcessing(true);
    setExtractedData(null);
    try {
      const file = values.file[0];
      const dataUri = await fileToDataUri(file);

      const result = await extractTaskDetailsFromDocument(dataUri);

      if (!result) {
        throw new Error('AI could not extract details from the document.');
      }

      setExtractedData(result);
      setOpen(false); // Close the upload dialog
      setAddTaskOpen(true); // Open the pre-filled task form dialog

      toast({
        title: 'Details Extracted',
        description:
          'Please review the extracted task details before creating the task.',
      });
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

  const handleAddTaskDialogClose = () => {
    setAddTaskOpen(false);
    setExtractedData(null);
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
              Select a document (.pdf, .txt, .md) to automatically create a task.
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
                      <Input type="file" {...form.register('file')} accept=".pdf,.txt,.md" />
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
                    'Extract Details'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {extractedData && (
        <AddTaskForm
          projectId={projectId}
          initialData={extractedData}
          open={addTaskOpen}
          onOpenChange={handleAddTaskDialogClose}
        >
          {/* This is a dummy trigger, the dialog is controlled by state */}
          <span />
        </AddTaskForm>
      )}
    </>
  );
}
