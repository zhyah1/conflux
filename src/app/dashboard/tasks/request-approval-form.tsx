'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { requestTaskApproval } from './actions';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Task } from './board/[projectId]/page';
import { useUser } from '@/app/user-provider';
import { Textarea } from '@/components/ui/textarea';

type User = {
  id: string;
  full_name: string | null;
  role: string;
};

const approvalRequestSchema = z.object({
  task_id: z.string(),
  approver_id: z.string().uuid('Please select an approver.'),
  message: z.string().optional(),
});

export function RequestApprovalForm({ children, task, projectUsers }: { children: React.ReactNode; task: Task; projectUsers: string[] }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvers, setApprovers] = useState<User[]>([]);
  const { toast } = useToast();
  const { profile } = useUser();

  useEffect(() => {
    async function fetchApprovers() {
      if (!profile) return;
      
      const targetRoles: string[] = ['admin', 'pmc', 'contractor', 'Landscape consultant', 'MEP consultant', 'Interior design Consultant'];
      
      const { data: projectUsersData, error: projectUsersError } = await supabase
        .from('project_users')
        .select('users!inner(id, full_name, role)')
        .eq('project_id', task.project_id);
        
      if (projectUsersError) {
          console.error("Error fetching project users for approvers", projectUsersError);
          return;
      }

      const usersOnProject = projectUsersData.map(pu => pu.users) as User[];
      const potentialApprovers = usersOnProject.filter(u => targetRoles.includes(u.role) && u.id !== profile.id);

      setApprovers(potentialApprovers);
    }
    if (open) {
      fetchApprovers();
    }
  }, [open, profile, task.project_id]);

  const form = useForm<z.infer<typeof approvalRequestSchema>>({
    resolver: zodResolver(approvalRequestSchema),
    defaultValues: {
      task_id: task.id,
      approver_id: undefined,
      message: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof approvalRequestSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await requestTaskApproval(values);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Approval Requested',
        description: 'The task has been submitted for approval.',
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error requesting approval',
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
          <DialogTitle className="font-headline">Request Task Approval</DialogTitle>
          <DialogDescription>
            Submit <span className="font-semibold">{task.title}</span> for approval.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="approver_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approver</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person to approve this task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {approvers.map((approver) => (
                        <SelectItem key={approver.id} value={approver.id}>
                          {approver.full_name} ({approver.role})
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add an optional message for the approver..." {...field} />
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
                    Submitting...
                  </>
                ) : 'Submit for Approval'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
