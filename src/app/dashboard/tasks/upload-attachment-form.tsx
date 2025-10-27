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
import { addTaskAttachment, uploadTaskFile } from './actions';
import { Loader2 } from 'lucide-react';

const uploadSchema = z.object({
  file: z.instanceof(FileList).refine((files) => files?.length === 1, 'File is required.'),
});

type UploadAttachmentFormProps = {
  children: React.ReactNode;
  taskId: string;
  onUploadSuccess: () => void;
};

export function UploadAttachmentForm({ children, taskId, onUploadSuccess }: UploadAttachmentFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setIsSubmitting(true);
    try {
      const file = values.file[0];
      
      const { path, error: uploadError } = await uploadTaskFile(file, taskId);

      if (uploadError || !path) {
        throw new Error(uploadError || 'File path not returned after upload.');
      }
      
      const result = await addTaskAttachment({
        task_id: taskId,
        file_path: path,
        file_name: file.name,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Attachment Uploaded',
        description: `"${file.name}" has been successfully uploaded.`,
      });
      onUploadSuccess();
      setOpen(false);
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error uploading attachment',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Attachment</DialogTitle>
          <DialogDescription>
            Select a file to attach to this task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>File</FormLabel>
                     <FormControl>
                         <Input type="file" {...form.register('file')} />
                     </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
