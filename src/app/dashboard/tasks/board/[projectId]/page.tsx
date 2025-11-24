'use client';

import { PageHeader } from '../../../components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Loader2, ArrowLeft, Filter, Search, LayoutGrid, GanttChartSquare, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { automaticDelayEscalation } from '@/ai/flows/automatic-delay-escalation';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { EditTaskForm } from '../../edit-task-form';
import { useParams, useRouter } from 'next/navigation';
import type { Project } from '../../../projects/page';
import { Input } from '@/components/ui/input';
import { AddTaskForm } from '../../add-task-form';
import { getProjectById } from '../../../projects/actions';
import { useUser } from '@/app/user-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getTasksByProjectId, updateTask } from '../../actions';
import { RequestApprovalForm } from '../../request-approval-form';
import { ProjectComments } from '../../../components/project-comments';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UploadTaskDocumentForm } from '../../upload-task-document-form';
import { Progress } from '@/components/ui/progress';
import { getDynamicStatus } from '@/lib/utils';


type User = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  users: User | null; 
  approver_id: string | null;
  description: string | null;
  due_date: string | null;
  progress: number | null;
  start_date: string | null;
  completion: number;
};

type TaskStatus = 'Waiting for Approval' | 'Backlog' | 'In Progress' | 'Blocked' | 'Done';

const statusColumns: { status: TaskStatus; title: string, color: string }[] = [
  { status: 'Waiting for Approval', title: 'WAITING FOR APPROVAL', color: 'bg-orange-500' },
  { status: 'Backlog', title: 'TO DO', color: 'bg-slate-500' },
  { status: 'In Progress', title: 'IN PROGRESS', color: 'bg-blue-500' },
  { status: 'Blocked', title: 'BLOCKED', color: 'bg-red-500' },
  { status: 'Done', title: 'DONE', color: 'bg-green-500' },
];

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

function TaskCard({ task, projectUsers }: { task: Task, projectUsers: string[] }) {
  const { profile } = useUser();
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [escalationResult, setEscalationResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
      resourcesAllocated: [task.users?.full_name || 'Unassigned'],
      issuesReported: [],
    });
    setEscalationResult(result);
    setIsLoading(false);
  };
  
  if (!profile) return null;
  
  const canEditTask = profile.role === 'admin' || profile.role === 'owner' || projectUsers.includes(profile.id);
  const canCheckDelays = profile.role === 'admin' || profile.role === 'pmc';
  const canRequestApproval = task.status !== 'Waiting for Approval';
  
  const dynamicStatus = getDynamicStatus({
    ...task,
    completion: task.progress || 0,
    end_date: task.due_date,
  });


  return (
    <div ref={setNodeRef} style={style} {...attributes}>
        <Link href={`/dashboard/tasks/view/${task.id}`} className="block">
            <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm leading-snug pr-2">{task.title}</p>
                   {canEditTask && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" {...listeners}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                          <EditTaskForm task={task}>
                             <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                              Edit Task
                             </button>
                          </EditTaskForm>
                          {canRequestApproval && (
                            <RequestApprovalForm task={task} projectUsers={projectUsers}>
                                <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                 Request Approval
                               </button>
                            </RequestApprovalForm>
                          )}
                          {canCheckDelays && <DropdownMenuItem onClick={handleCheckDelay}>Check for Delays (AI)</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                   )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{dynamicStatus.expectedCompletion}%</span>
                  </div>
                  <Progress value={dynamicStatus.expectedCompletion} className="h-1"/>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.users?.avatar_url || ''} alt={task.users?.full_name || 'Unassigned'} />
                          <AvatarFallback>{task.users ? getInitials(task.users.full_name) : '?'}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.users?.full_name || 'Unassigned'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
        </Link>
    </div>
  );
}

function DroppableColumn({ id, title, color, tasks, count, projectId, projectUsers, canManageTasks }: { id: TaskStatus, title: string, color: string, tasks: Task[], count: number, projectId: string, projectUsers: string[], canManageTasks: boolean }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div ref={setNodeRef} className="bg-muted/50 rounded-lg h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{title}</span>
                    <Badge className={`rounded-full ${color} text-white`}>{count}</Badge>
                </div>
                 {canManageTasks && (
                    <AddTaskForm projectId={projectId} status={id}>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </AddTaskForm>
                )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} projectUsers={projectUsers} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-10">
                        <p className="text-sm">No tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function KanbanBoard({ projectId, projectUsers }: { projectId: string, projectUsers: string[] }) {
  const { profile } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  const canManageTasks = profile?.role === 'admin' || profile?.role === 'pmc' || profile?.role === 'contractor' || profile?.role === 'consultant';

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: tasksData, error: tasksError } = await getTasksByProjectId(projectId);

    if (!tasksError) {
      setTasks(tasksData as Task[]);
    } else {
      console.error('Error fetching tasks:', tasksError);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (projectId) {
      fetchTasks();
      
      const channel = supabase
        .channel(`tasks-changes-${projectId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, 
          (payload) => {
            fetchTasks(); // Refetch tasks on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [projectId]);
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);


  const taskCounts = useMemo(() => {
    return statusColumns.reduce((acc, col) => {
      acc[col.status] = filteredTasks.filter(task => task.status === col.status).length;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [filteredTasks]);

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status);
  };
  
   const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
        return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    const newStatus = over.id as TaskStatus;

    if (!activeTask || activeTask.status === newStatus || newStatus === 'Waiting for Approval') {
      return;
    }

    // Optimistic UI update
    setTasks(tasks => tasks.map(t => t.id === active.id ? { ...t, status: newStatus } : t));

    // Persist changes to the backend
    const result = await updateTask({
      id: activeTask.id,
      title: activeTask.title,
      priority: activeTask.priority,
      project_id: activeTask.project_id,
      description: activeTask.description,
      due_date: activeTask.due_date ? new Date(activeTask.due_date) : undefined,
      progress: activeTask.progress,
      status: newStatus,
      // Ensure assignee_id is correctly formatted for the action
      assignee_id: activeTask.users?.id || null
    });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error updating task',
        description: result.error,
      });
      // Revert optimistic update on error
      setTasks(tasks => tasks.map(t => t.id === active.id ? { ...t, status: activeTask.status } : t));
    } else {
        toast({
            title: 'Task Updated',
            description: `Moved "${activeTask.title}" to ${newStatus}.`,
        });
    }
  };


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts['Waiting for Approval']}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts['Backlog']}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts['In Progress']}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts['Done']}</div>
          </CardContent>
        </Card>
      </div>

       <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4"/> Filters</Button>
      </div>
      
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
          {statusColumns.map(({ status, title, color }) => (
            <DroppableColumn
              key={status}
              id={status}
              title={title}
              color={color}
              tasks={getTasksByStatus(status)}
              count={taskCounts[status]}
              projectId={projectId}
              projectUsers={projectUsers}
              canManageTasks={canManageTasks}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}

export default function TaskBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { profile } = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');

  const canManageTasks = profile?.role === 'admin' || profile?.role === 'pmc' || profile?.role === 'contractor' || profile?.role === 'consultant';


  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    };

    async function fetchProjectData() {
      setLoading(true);
      
      const { data: projectData, error: projectError } = await getProjectById(projectId);
      
      if (projectError || !projectData) {
        console.error('Error fetching project or user not authorized:', projectError);
        setProject(null);
      } else {
        const currentProject = projectData as Project;
        setProject(currentProject);
      }
      
      setLoading(false);
    }

    fetchProjectData();

  }, [projectId]);
  
  if (loading) {
     return (
        <div className="flex flex-col h-full gap-6 p-4 md:p-6">
            <PageHeader title={<Skeleton className="h-8 w-64" />} description={<div className="h-5 w-80"><Skeleton className="h-full w-full" /></div>}>
                 <Skeleton className="h-9 w-40" />
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
             <div className="grid gap-6 md:grid-cols-4 items-start">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
    );
  }

  if (!project) {
    return (
         <div className="flex flex-col items-center justify-center h-full text-center">
            <PageHeader title="Project not found" description="The project you are looking for does not exist or you do not have permission to view it." />
             <Button onClick={() => router.push('/dashboard/projects')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects List
             </Button>
        </div>
    )
  }
  
  const backButtonLink = project.parent_id 
    ? `/dashboard/projects/${project.parent_id}`
    : '/dashboard/tasks';

  const projectUsers = project.users.map(u => u.id);

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader 
        title={`${project.name} Board`} 
        description={'Manage tasks and track progress.'}
      >
        <div className="flex gap-2">
            {canManageTasks && (
                <UploadTaskDocumentForm projectId={projectId}>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4"/>Upload Task Doc</Button>
                </UploadTaskDocumentForm>
            )}
            <Button onClick={() => router.push(backButtonLink)} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {view === 'kanban' ? <LayoutGrid className="mr-2 h-4 w-4"/> : <GanttChartSquare className="mr-2 h-4 w-4" />}
                  {view === 'kanban' ? 'Kanban' : 'Gantt'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Switch View</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                  <DropdownMenuRadioItem value="kanban">
                     <LayoutGrid className="mr-2 h-4 w-4"/> Kanban Board
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="gantt" disabled>
                     <GanttChartSquare className="mr-2 h-4 w-4"/> Gantt Chart
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </PageHeader>
      
      {view === 'kanban' && (
        <div className="flex flex-col gap-6">
            <KanbanBoard projectId={projectId} projectUsers={projectUsers} />
            <ProjectComments projectId={projectId} />
        </div>
      )}
      {view === 'gantt' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Gantt Chart view is not yet implemented.
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
