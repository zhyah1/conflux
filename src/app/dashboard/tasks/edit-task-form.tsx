

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
  DialogFooter,
  DialogClose,
  DialogTrigger,
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
import { updateTask } from './actions';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Task } from './board/[projectId]/page';
import { useUser } from '@/app/user-provider';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type User = {
  id: string;
  full_name: string | null;
  role: string;
};

const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title is required.'),
  priority: z.string().min(1, 'Priority is required.'),
  status: z.string().min(1, 'Status is required.'),
  assignee_id: z.string().uuid().optional().nullable(),
  project_id: z.string().min(1, "Project ID is required."),
  approver_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
});

type EditTaskFormProps = {
  task: Task;
  children: React.ReactNode;
};

export function EditTaskForm({ task, children }: EditTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { profile } = useUser();

  const canEditAllFields = profile && ['admin', 'pmc', 'contractor', 'consultant'].includes(profile.role);
  const canEditAssignee = profile && ['admin', 'pmc', 'contractor', 'consultant'].includes(profile.role);
  
  useEffect(() => {
    async function fetchUsers() {
      if (!profile || !canEditAssignee) return;
      
      let targetRoles: string[] = [];
      switch (profile.role) {
        case 'admin':
          targetRoles = ['pmc', 'contractor', 'consultant', 'subcontractor'];
          break;
        case 'pmc':
          targetRoles = ['contractor', 'consultant', 'subcontractor'];
          break;
        case 'contractor':
        case 'consultant':
          targetRoles = ['subcontractor'];
          break;
      }

      if (targetRoles.length === 0) {
        setAssignableUsers([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .in('role', targetRoles);

      if (error) {
        console.error('Error fetching users for form', error);
      } else {
        setAssignableUsers(data);
      }
    }
    if (open) {
      fetchUsers();
    }
  }, [open, profile, canEditAssignee]);

  const form = useForm<z.infer<typeof updateTaskSchema>>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      assignee_id: task.users?.id || null,
      project_id: task.project_id,
      approver_id: task.approver_id || null,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date) : undefined,
      progress: task.progress || 0,
    },
  });
  
  useEffect(() => {
      form.reset({
        id: task.id,
        title: task.title,
        priority: task.priority,
        status: task.status,
        assignee_id: task.users?.id || null,
        project_id: task.project_id,
        approver_id: task.approver_id || null,
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        progress: task.progress || 0,
    })
  }, [task, form, open]);

  const onSubmit = async (values: z.infer<typeof updateTaskSchema>) => {
    setIsSubmitting(true);
    try {
      const result = await updateTask(values);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Task Updated',
        description: `Task "${values.title}" has been successfully updated.`,
      });
      setOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error updating task',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Task</DialogTitle>
          <DialogDescription>
            Update the details for this task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Install window frames" {...field} disabled={!canEditAllFields} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a more detailed description..." {...field} disabled={!canEditAllFields}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canEditAllFields}>
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
            </div>


            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="assignee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "null"}
                        disabled={!canEditAssignee}
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
                 <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                disabled={!canEditAllFields}
                                >
                                {field.value ? (
                                    format(new Date(field.value), "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
           
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress: {field.value}%</FormLabel>
                  <FormControl>
                     <Input type="range" min="0" max="100" value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
