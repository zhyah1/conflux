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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export const ExtractedTaskDetailsSchema = z.object({
  title: z.string().describe('The title of the task.'),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The priority of the task.'),
  status: z
    .enum(['Waiting for Approval', 'Backlog', 'In Progress', 'Blocked', 'Done'])
    .describe('The current status of the task.'),
  description: z.string().describe('A detailed description of the task.'),
  due_date: z
    .string()
    .optional()
    .describe('The due date for the task in YYYY-MM-DD format.'),
});
export type ExtractedTaskDetails = z.infer<typeof ExtractedTaskDetailsSchema>;


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
  description: z.string().optional().nullable(),
  due_date: z.date().optional().nullable(),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
});

type AddTaskFormProps = {
  children: React.ReactNode;
  projectId: string;
  status?: string;
  initialData?: ExtractedTaskDetails | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};


export function AddTaskForm({ 
    children, 
    projectId, 
    status = 'Backlog',
    initialData = null,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
}: AddTaskFormProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { profile, user } = useUser();

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setUncontrolledOpen;


  const getDefaultValues = () => ({
    title: initialData?.title || '',
    priority: initialData?.priority || 'Medium',
    status: initialData?.status || status,
    assignee_id: profile?.role === 'subcontractor' ? user?.id : null,
    project_id: projectId,
    approver_id: undefined,
    description: initialData?.description || '',
    due_date: initialData?.due_date ? parseISO(initialData.due_date) : undefined,
    progress: 0,
  });

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  }, [initialData, status, projectId, open]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{initialData ? 'Review Extracted Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Review the details extracted by AI before creating the task.' : 'Fill in the details below to create a new task.'}
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
                    <Input placeholder="e.g., Install window frames" {...field} />
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
                    <Textarea placeholder="Add a more detailed description..." {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
            <div className="grid grid-cols-2 gap-4">
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
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
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
                     <Input type="range" min="0" max="100" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
