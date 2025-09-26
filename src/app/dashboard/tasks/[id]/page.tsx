'use client';

import { PageHeader } from '../../components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { automaticDelayEscalation } from '@/ai/flows/automatic-delay-escalation';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { AddTaskForm } from '../add-task-form';
import { EditTaskForm } from '../edit-task-form';
import { useParams, useRouter } from 'next/navigation';
import type { Project } from '../../projects/page';


type User = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  users: User | null; 
};

type TaskStatus = 'Backlog' | 'In Progress' | 'Done';

const statusColumns: { status: TaskStatus; title: string }[] = [
  { status: 'Backlog', title: 'Backlog' },
  { status: 'In Progress', title: 'In Progress' },
  { status: 'Done', title: 'Done' },
];

function TaskCard({ task }: { task: Task }) {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [escalationResult, setEscalationResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const assigneeName = task.users?.full_name || 'Unassigned';
  const assigneeAvatar = task.users?.avatar_url || `https://ui-avatars.com/api/?name=${assigneeName}&background=random`;
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };


  const handleCheckDelay = async () => {
    setIsAlertOpen(true);
    setIsLoading(true);
    setEscalationResult(null);

    const result = await automaticDelayEscalation({
      taskId: task.id,
      taskName: task.title,
      startDate: '2024-01-01',
      dueDate: '2024-12-31',
      currentProgress: task.status === 'Done' ? 100 : task.status === 'In Progress' ? 50 : 0,
      dependencies: [],
      resourcesAllocated: [assigneeName],
      issuesReported: [],
    });
    setEscalationResult(result);
    setIsLoading(false);
  };

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <p className="font-semibold text-sm mb-2">{task.title}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <EditTaskForm task={task}>
                   <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                    Edit Task
                   </button>
                </EditTaskForm>
                <DropdownMenuItem onClick={handleCheckDelay}>Check for Delays (AI)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between">
            <Badge
              variant={
                task.priority === 'High'
                  ? 'destructive'
                  : task.priority === 'Medium'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {task.priority}
            </Badge>
            <Avatar className="h-6 w-6">
              <AvatarImage src={assigneeAvatar} alt={assigneeName} />
              <AvatarFallback>{getInitials(assigneeName)}</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Automatic Delay Escalation Analysis</AlertDialogTitle>
             <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
              {isLoading && (
                 <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing task data with AI to check for potential delays...</span>
                  </div>
              )}
              {!isLoading &&
                escalationResult &&
                (escalationResult.shouldEscalate
                  ? 'Potential delay detected. Escalation is recommended.'
                  : 'No significant delay detected. The task appears to be on track.')}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!isLoading && escalationResult && (
            <div className="text-sm space-y-4">
              <div>
                <h4 className="font-semibold">Reason:</h4>
                <p className="text-muted-foreground">{escalationResult.escalationReason}</p>
              </div>
              <div>
                <h4 className="font-semibold">Suggested Actions:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  {escalationResult.suggestedActions.map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function TaskBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-changes-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, 
        (payload) => {
          console.log('Change received!', payload);
          fetchTasksAndProject();
        }
      )
      .subscribe()

    async function fetchTasksAndProject() {
      setLoading(true);
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error('Error fetching project:', projectError);
      } else {
        setProject(projectData as Project);
      }

      // Fetch tasks for the project
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          project_id,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId);

      if (!tasksError) {
        setTasks(tasksData as Task[]);
      } else {
        console.error('Error fetching tasks:', tasksError);
      }
      setLoading(false);
    }

    fetchTasksAndProject();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [projectId]);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };
  
  if (loading && !project) {
     return (
        <div className="flex flex-col h-full">
            <PageHeader title={<Skeleton className="h-8 w-48" />} description={<Skeleton className="h-5 w-64" />}>
                 <Skeleton className="h-9 w-32" />
            </PageHeader>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {statusColumns.map(({ status, title }) => (
                <Card key={status} className="h-full">
                    <CardHeader>
                    <CardTitle className="font-headline">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>
    );
  }

  if (!project) {
    return (
         <div className="flex flex-col items-center justify-center h-full text-center">
            <PageHeader title="Project not found" description="The project you are looking for does not exist." />
             <Button onClick={() => router.push('/dashboard/tasks')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects List
             </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={`Task Board: ${project.name}`} description="Manage and track tasks for this project.">
         <div className="flex gap-2">
            <Button onClick={() => router.push('/dashboard/tasks')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
            </Button>
            <AddTaskForm projectId={projectId}>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Task
              </Button>
            </AddTaskForm>
        </div>
      </PageHeader>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {statusColumns.map(({ status, title }) => (
          <Card key={status} className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                getTasksByStatus(status).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
