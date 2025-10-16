'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '../components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project, User } from '../projects/page';
import Link from 'next/link';
import { ArrowRight, Folder, GanttChartSquare, Home } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProjects } from '../projects/actions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

export default function TasksProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await getProjects();

      if (!error && data) {
        const allProjects = data as unknown as Project[];
        const projectMap = new Map(
          allProjects.map((p) => [p.id, { ...p, subProjects: [] as Project[] }])
        );

        const hierarchicalProjects: Project[] = [];

        allProjects.forEach((p) => {
          const projectWithSubprojects = projectMap.get(p.id)!;
          if (p.parent_id && projectMap.has(p.parent_id)) {
            const parent = projectMap.get(p.parent_id);
            if (parent) {
              parent.subProjects.push(projectWithSubprojects);
            }
          } else {
            hierarchicalProjects.push(projectWithSubprojects);
          }
        });

        hierarchicalProjects.forEach((p) => {
          if (p.subProjects && p.subProjects.length > 0) {
            p.subProjects.sort(
              (a, b) => (a.phase_order || 0) - (b.phase_order || 0)
            );
          }
        });

        setProjects(hierarchicalProjects);
      } else {
        console.error('Error fetching projects:', error);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const projectsToShow = currentProject ? currentProject.subProjects || [] : projects;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={currentProject ? `${currentProject.name}` : "Task Boards"}
        description="Select a project or phase to view its Kanban board."
      >
        <Button asChild>
          <Link href="/dashboard/gantt">
            <GanttChartSquare className="mr-2 h-4 w-4" />
            Gantt Chart
          </Link>
        </Button>
      </PageHeader>
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
                <Button variant="ghost" onClick={() => setCurrentProject(null)} className="gap-2">
                    <Home className="h-4 w-4"/>
                    All Projects
                </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentProject && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{currentProject.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
          )}
        </BreadcrumbList>
      </Breadcrumb>


      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projectsToShow.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
          {projectsToShow.map((project) => (
            <Card key={project.id} className="flex flex-col h-full">
              <CardHeader>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                        <CardTitle className="flex items-start gap-2 font-headline flex-1">
                            {project.parent_id ? <GanttChartSquare className="h-5 w-5 mt-1" /> : <Folder className="h-5 w-5 mt-1" />}
                            <span className="flex-1">{project.name}</span>
                        </CardTitle>
                        <Badge
                            variant={
                                project.status === 'Completed' ? 'outline' :
                                project.status === 'Delayed' ? 'destructive' : 'secondary'
                            }
                            className="whitespace-nowrap"
                        >
                            {project.status}
                        </Badge>
                    </div>
                    {project.owner && <CardDescription>{project.owner}</CardDescription>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                 <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{project.completion}%</span>
                      </div>
                      <Progress value={project.completion} className="h-2" />
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Team</div>
                       {project.users && project.users.length > 0 ? (
                          <div className="flex items-center">
                            {project.users.slice(0, 3).map((user) => (
                              <TooltipProvider key={user.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-8 w-8 border-2 border-background -ml-2 first:ml-0">
                                      <AvatarImage src={user.avatar_url || ''} alt={user.full_name || ''} />
                                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.full_name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {project.users.length > 3 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-8 w-8 border-2 border-background -ml-2">
                                      <AvatarFallback>+{project.users.length - 3}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{project.users.slice(3).map(u => u.full_name).join(', ')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                    </div>
                </div>

                {project.subProjects && project.subProjects.length > 0 ? (
                  <Button onClick={() => setCurrentProject(project)} className="mt-auto w-full">
                    View Phases <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Link
                    href={`/dashboard/tasks/board/${project.id}`}
                    className={cn(buttonVariants({ variant: 'outline' }), "mt-auto w-full")}
                  >
                    View Task Board <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-24 text-center text-muted-foreground">
             {currentProject ? 'This project has no sub-phases.' : 'You have not been assigned to any projects yet.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
