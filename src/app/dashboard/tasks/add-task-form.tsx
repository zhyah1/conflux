'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
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
import { addTask } from './actions';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/app/user-provider';

type User = {
  id: string;
  full_name: string | null;
  role: string;
};

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  status: z.string().min(1, 'Status is required.'),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().min(1, 'Project ID is required.'),
  approver_id: z.string().uuid().optional().nullable(),
});

export function AddTaskForm({ children, projectId, status = 'Backlog' }: { children: React.ReactNode, projectId: string, status?: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { profile, user } = useUser();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      priority: 'Medium',
      status: status,
      assignee_id: profile?.role === 'subcontractor' ? user?.id : null,
      project_id: projectId,
      approver_id: undefined,
    },
  });

  const watchStatus = form.watch('status');
  const needsApproval = watchStatus === 'Waiting for Approval';

  useEffect(() => {
    if (!needsApproval) {
        form.setValue('approver_id', undefined);
    }
  }, [needsApproval, form]);


  useEffect(() => {
    async function fetchUsers() {
      if (!profile || !user) return;

      const { data: projectUsers, error: projectUsersError } = await supabase
        .from('project_users')
        .select('users!inner(id, full_name, role)')
        .eq('project_id', projectId);

      if (projectUsersError) {
        console.error('Error fetching project users for task form', projectUsersError);
        return;
      }
      
      const allProjectMembers = projectUsers.map((pu: any) => pu.users).filter(Boolean) as User[];
      
      let potentialAssignees: User[] = [];

      switch (profile.role) {
        case 'admin':
          potentialAssignees = allProjectMembers;
          break;
        case 'pmc':
          potentialAssignees = allProjectMembers.filter(u => ['contractor', 'subcontractor'].includes(u.role));
          break;
        case 'contractor':
          const self = allProjectMembers.find(u => u.id === user.id);
          const subcontractors = allProjectMembers.filter(u => u.role === 'subcontractor');
          potentialAssignees = self ? [self, ...subcontractors] : subcontractors;
          break;
        case 'subcontractor':
            const selfSub = allProjectMembers.find(u => u.id === user.id);
            if(selfSub) potentialAssignees = [selfSub];
            break;
      }
      setAssignableUsers(potentialAssignees);

      // Fetch approvers if needed
      const approverRoles = ['admin', 'pmc', 'contractor'];
      const potentialApprovers = allProjectMembers.filter(u => approverRoles.includes(u.role) && u.id !== profile.id);
      setApprovers(potentialApprovers);
    }

    if (open) {
      fetchUsers();
    }
  }, [open, profile, projectId, user]);

  // Reset form status when the prop changes
  useEffect(() => {
    form.reset({
      title: '',
      priority: 'Medium',
      status,
      project_id: projectId,
      assignee_id: profile?.role === 'subcontractor' ? user?.id : null,
      approver_id: undefined,
    });
  }, [status, projectId, form, open, profile, user]);


  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await addTask(values);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Task Created',
        description: `Task "${values.title}" has been successfully added.`,
      });
      setOpen(false);
      form.reset();
      router.refresh(); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error creating task',
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
          <DialogTitle className="font-headline">Add New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Install window frames" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Waiting for Approval">Waiting for Approval</SelectItem>
                      <SelectItem value="Backlog">Backlog</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {needsApproval && (
               <FormField
                  control={form.control}
                  name="approver_id"
                  rules={{ required: 'Approver is required when status is "Waiting for Approval".' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approver</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an approver" />
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
             )}

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    disabled={profile?.role === 'subcontractor'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Unassigned</SelectItem>
                      {assignableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Loader2 className="animate-spin" />
                    Adding Task...
                  </>
                ) : 'Add Task'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
