'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addDocument, uploadDocumentFile } from './actions';
import { Loader2 } from 'lucide-react';
import { getProjects } from '../projects/actions';
import type { Project } from '../projects/page';
import { Progress } from '@/components/ui/progress';

const uploadSchema = z.object({
  project_id: z.string().min(1, 'Please select a project.'),
  file: z.instanceof(FileList).refine((files) => files?.length === 1, 'File is required.'),
});

export function UploadDocumentForm({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
  });

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await getProjects();
      if (!error && data) {
        // We only care about top-level projects for document association
        setProjects(data.filter(p => !p.parent_id));
      }
    }
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setIsSubmitting(true);
    try {
      const file = values.file[0];
      
      const { path, error: uploadError } = await uploadDocumentFile(file, values.project_id);

      if (uploadError || !path) {
        throw new Error(uploadError || 'File path not returned after upload.');
      }
      
      const result = await addDocument({
        name: file.name,
        project_id: values.project_id,
        file_path: path,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Document Uploaded',
        description: `"${file.name}" has been successfully uploaded.`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error uploading document',
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
          <DialogTitle className="font-headline">Upload Document</DialogTitle>
          <DialogDescription>
            Select a project and a file to upload.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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