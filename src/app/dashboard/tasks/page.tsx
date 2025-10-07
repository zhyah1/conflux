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
import { ArrowRight, Folder, GanttChartSquare } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProjects } from '../projects/actions';

export default function TasksProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
          if (p.parent_id && projectMap.has(p.parent_id)) {
            const parent = projectMap.get(p.parent_id);
            if (parent) {
              parent.subProjects.push(projectMap.get(p.id)!);
            }
          } else {
            hierarchicalProjects.push(projectMap.get(p.id)!);
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Task Boards"
        description="Select a project to view its Kanban board and manage tasks."
      />
      
      {loading ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length > 0 ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <Folder className="h-6 w-6" /> {project.name}
                </CardTitle>
                <CardDescription>{project.owner}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                 <ul className="space-y-2">
                    {project.subProjects?.map(sub => (
                         <li key={sub.id}>
                            <Link href={`/dashboard/tasks/${sub.id}`} className={cn(buttonVariants({variant: 'ghost'}), "w-full justify-start gap-2")}>
                                <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
                                {sub.name}
                            </Link>
                        </li>
                    ))}
                 </ul>
                 <Link
                    href={`/dashboard/tasks/${project.id}`}
                    className={cn(buttonVariants({ variant: 'outline' }), "mt-auto w-full")}
                  >
                    View Master Board <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="py-24 text-center text-muted-foreground">
                You have not been assigned to any projects yet.
            </CardContent>
        </Card>
      )}
    </div>
  );
}
