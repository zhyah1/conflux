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
import type { Project } from '../projects/page';
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
  const hasSubProjects = projectsToShow.some(p => p.subProjects && p.subProjects.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={currentProject ? `${currentProject.name}` : "Task Boards"}
        description="Select a project or phase to view its Kanban board."
      >
        <Button>
            <GanttChartSquare className="mr-2 h-4 w-4" />
            Gantt Chart
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {projectsToShow.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  {project.parent_id ? <GanttChartSquare className="h-6 w-6" /> : <Folder className="h-6 w-6" />}
                  {project.name}
                </CardTitle>
                {project.owner && <CardDescription>{project.owner}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-4">
                {project.subProjects && project.subProjects.length > 0 ? (
                  <Button onClick={() => setCurrentProject(project)} className="mt-auto w-full">
                    View Phases <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Link
                    href={`/dashboard/tasks/${project.id}`}
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
