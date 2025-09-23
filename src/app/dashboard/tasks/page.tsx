'use client';

import { PageHeader } from '../components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tasks } from '@/lib/data';
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { automaticDelayEscalation } from '@/ai/flows/automatic-delay-escalation';
import React from 'react';

type Task = (typeof tasks)[0];
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
      resourcesAllocated: [task.assignee.name],
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
                <DropdownMenuItem>Edit Task</DropdownMenuItem>
                <DropdownMenuItem>Change Assignee</DropdownMenuItem>
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
              <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
              <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Automatic Delay Escalation Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              {isLoading && 'Analyzing task data with AI to check for potential delays...'}
              {!isLoading &&
                escalationResult &&
                (escalationResult.shouldEscalate
                  ? 'Potential delay detected. Escalation is recommended.'
                  : 'No significant delay detected. The task appears to be on track.')}
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

export default function TasksPage() {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Tasks" description="Manage and track tasks using the Kanban board.">
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Task
        </Button>
      </PageHeader>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {statusColumns.map(({ status, title }) => (
          <Card key={status} className="h-full">
            <CardHeader>
              <CardTitle className="font-headline">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {getTasksByStatus(status).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
