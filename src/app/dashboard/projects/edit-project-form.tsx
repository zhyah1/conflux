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
import { updateProject, getProjects } from './actions';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Project } from './page';
import { MultiSelect } from '@/components/ui/multi-select';
import { useUser } from '@/app/user-provider';

type User = {
  id: string;
  full_name: string | null;
  role: string;
};

const updateProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required.'),
  status: z.string().min(1, 'Status is required.'),
  owner: z.string().optional(),
  budget: z.coerce.number().positive('Budget must be a positive number.'),
  completion: z.coerce.number().min(0).max(100, 'Completion must be between 0 and 100.'),
  start_date: z.date({ required_error: 'Start date is required.' }),
  end_date: z.date({ required_error: 'End date is required.' }),
  assignee_ids: z.array(z.string().uuid()).optional(),
  parent_id: z.string().optional().nullable(),
});

type EditProjectFormProps = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProjectForm({ project, open, onOpenChange }: EditProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  const { profile } = useUser();

  const isOwner = profile?.role === 'owner';
  const canEditAllFields = profile && ['admin', 'pmc'].includes(profile.role) && !isOwner;
  const canEditAssignments = profile && ['admin', 'pmc', 'contractor'].includes(profile.role) && !isOwner;
  const isContractorOrSub = profile && ['contractor', 'subcontractor'].includes(profile.role);

  
  useEffect(() => {
    async function fetchData() {
      if (!profile) return;

      let targetRoles: string[] = [];
       switch (profile.role) {
        case 'admin':
          targetRoles = ['pmc', 'contractor', 'subcontractor', 'client'];
          break;
        case 'pmc':
          targetRoles = ['contractor', 'subcontractor'];
          break;
        case 'contractor':
          targetRoles = ['subcontractor'];
          break;
      }

      if (targetRoles.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, role')
          .in('role', targetRoles);

        if (usersError) console.error('Error fetching users for form', usersError);
        else setAssignableUsers(usersData || []);
      } else {
        setAssignableUsers([]);
      }


      const { data: projectsData, error: projectsError } = await getProjects();
      if (projectsError) console.error('Error fetching projects for form', projectsError);
      else setAllProjects(projectsData as Project[]);
    }
    if (open) {
      fetchData();
    }
  }, [open, profile]);

  const form = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      id: project.id,
      name: project.name,
      status: project.status,
      owner: project.owner,
      budget: project.budget,
      completion: project.completion,
      start_date: new Date(project.start_date),
      end_date: new Date(project.end_date),
      assignee_ids: project.users.map(u => u.id),
      parent_id: project.parent_id,
    },
  });
  
  useEffect(() => {
    form.reset({
      id: project.id,
      name: project.name,
      status: project.status,
      owner: project.owner,
      budget: project.budget,
      completion: project.completion,
      start_date: new Date(project.start_date),
      end_date: new Date(project.end_date),
      assignee_ids: project.users.map(u => u.id),
      parent_id: project.parent_id,
    });
  }, [project, form]);


  const onSubmit = async (values: z.infer<typeof updateProjectSchema>) => {
    setIsSubmitting(true);
    try {
      const submissionValues = {
        ...values,
        parent_id: values.parent_id === 'null' ? null : values.parent_id,
      };

      const result = await updateProject(submissionValues);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Project Updated',
        description: `Project "${values.name}" has been successfully updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error updating project',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userOptions = assignableUsers.map(u => ({ value: u.id, label: `${u.full_name} (${u.role})`}));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Project</DialogTitle>
          <DialogDescription>
            Update the details for your project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Downtown Tower Renovation" {...field} disabled={!canEditAllFields}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Project</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'null'} disabled={!canEditAllFields}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">None (This is a master project)</SelectItem>
                      {allProjects
                        .filter(p => p.id !== project.id && !p.parent_id) 
                        .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
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
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Nexus Properties" {...field} disabled={!canEditAllFields} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignee_ids"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Assign To</FormLabel>
                   <MultiSelect
                      options={userOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select team members..."
                      disabled={!canEditAssignments}
                    />
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
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isOwner}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="On Track">On Track</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000000" {...field} disabled={!canEditAllFields} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                        disabled={(date) =>
                          date > (form.getValues('end_date') || new Date('2999-01-01')) 
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
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
                        disabled={(date) =>
                          date < (form.getValues('start_date') || new Date("1900-01-01"))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completion"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Completion (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" {...field} disabled={isOwner} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="col-span-2 mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || isOwner}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving Changes...
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
