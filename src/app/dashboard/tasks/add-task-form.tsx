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
});

export function AddTaskForm({ children, projectId, status = 'Backlog' }: { children: React.ReactNode, projectId: string, status?: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { profile, user } = useUser();

  useEffect(() => {
    async function fetchUsers() {
      if (!profile || !user) return;

      // First, get the current project to find its parent
      const { data: currentProject, error: projectError } = await supabase
        .from('projects')
        .select('parent_id')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error('Error fetching current project', projectError);
        return;
      }

      const projectIdsToFetch = [projectId];
      if (currentProject.parent_id) {
        projectIdsToFetch.push(currentProject.parent_id);
      }

      const { data: projectUsers, error: projectUsersError } = await supabase
        .from('project_users')
        .select('users(id, full_name, role)')
        .in('project_id', projectIdsToFetch);

      if (projectUsersError) {
        console.error('Error fetching project users for task form', projectUsersError);
        return;
      }
      
      // Deduplicate users
      const userMap = new Map<string, User>();
      projectUsers.forEach((pu: any) => {
        if (pu.users && !userMap.has(pu.users.id)) {
            userMap.set(pu.users.id, pu.users);
        }
      });
      const allProjectMembers = Array.from(userMap.values());
      
      let potentialAssignees: User[] = [];

      switch (profile.role) {
        case 'admin':
          potentialAssignees = allProjectMembers;
          break;
        case 'pmc':
          potentialAssignees = allProjectMembers.filter(u => ['contractor', 'subcontractor'].includes(u.role));
          break;
        case 'contractor':
          const self = { id: user.id, full_name: profile.full_name, role: profile.role };
          const subcontractors = allProjectMembers.filter(u => u.role === 'subcontractor');
          potentialAssignees = [self, ...subcontractors];
          break;
        case 'subcontractor':
            if(user && profile) {
                potentialAssignees = [{id: user.id, full_name: profile.full_name, role: profile.role}];
            }
            break;
      }
      setAssignableUsers(potentialAssignees);
    }

    if (open) {
      fetchUsers();
    }
  }, [open, profile, projectId, user]);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      priority: 'Medium',
      status: status,
      assignee_id: profile?.role === 'subcontractor' ? user?.id : null,
      project_id: projectId,
    },
  });

  // Reset form status when the prop changes
  useEffect(() => {
    form.reset({
      ...form.getValues(),
      status,
      project_id: projectId,
       assignee_id: profile?.role === 'subcontractor' ? user?.id : null,
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
                      <SelectItem value="Pending">Pending</SelectItem>
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
