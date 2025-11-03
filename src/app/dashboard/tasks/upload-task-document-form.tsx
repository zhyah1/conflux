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
} from '@/ai/flows/extract-task-details-from-document';
import { addMultipleTasks } from './actions';
import { useRouter } from 'next/navigation';

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
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setIsProcessing(true);
    try {
      const file = values.file[0];
      const dataUri = await fileToDataUri(file);

      // 1. Extract tasks using AI
      const extractedTasks = await extractTaskDetailsFromDocument(dataUri);

      if (!extractedTasks || extractedTasks.length === 0) {
        throw new Error('AI could not extract any tasks from the document.');
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
              Select a document (.pdf, .txt, .md) to automatically create tasks.
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
