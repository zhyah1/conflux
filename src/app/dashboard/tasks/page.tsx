'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '../components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '../projects/page';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { getProjects } from '../projects/actions';

export default function TasksProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await getProjects();

      if (!error && data) {
        // Show all projects the user has access to, not just main ones.
        setProjects(data as unknown as Project[]);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          : projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    {project.parent_id ? 'Phase' : 'Master Project'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                     <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Completion</span>
                        <span>{project.completion}%</span>
                    </div>
                    <Progress value={project.completion} className="h-2" />
                  </div>
                  <Link
                    href={`/dashboard/tasks/${project.id}`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
                  >
                    View Board <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
      </div>
       { !loading && projects.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            You have not been assigned to any projects yet.
          </div>
        )}
    </div>
  );
}
