'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '../components/page-header';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Project } from '../projects/page';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { getProjects } from '../projects/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


const ProjectRow = ({ project, level = 0 }: { project: Project; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubProjects = project.subProjects && project.subProjects.length > 0;

  return (
    <>
      <TableRow key={project.id} className="group">
        <TableCell style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}>
          <div className="flex items-center gap-3">
             {hasSubProjects ? (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
               <span className="w-6 h-6 flex items-center justify-center">
                 {level > 0 && <span className="h-full w-px bg-border -translate-x-3.5"></span>}
               </span>
            )}
            <Link href={`/dashboard/tasks/${project.id}`} className="flex-1 flex items-center gap-3 group-hover:underline">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <div className="font-medium">
                {project.name}
                {level === 0 && <div className="text-sm text-muted-foreground">{project.owner}</div>}
                </div>
            </Link>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
           <div className="flex items-center justify-end gap-2">
                <Progress value={project.completion} className="h-2 w-24" />
                <span>{project.completion}%</span>
            </div>
        </TableCell>
        <TableCell className="text-right">
             <Link
                href={`/dashboard/tasks/${project.id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                View Board <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </TableCell>
      </TableRow>
      {isExpanded && hasSubProjects && project.subProjects?.map(sub => (
          <ProjectRow key={sub.id} project={sub} level={level + 1} />
      ))}
    </>
  );
};


export default function TasksProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await getProjects();

      if (!error && data) {
         const allProjects = data as unknown as Project[];
        const projectMap = new Map(allProjects.map(p => [p.id, { ...p, subProjects: [] as Project[] }]));
        
        const hierarchicalProjects: Project[] = [];

        allProjects.forEach(p => {
          if (p.parent_id && projectMap.has(p.parent_id)) {
            const parent = projectMap.get(p.parent_id);
            if (parent) {
                parent.subProjects.push(projectMap.get(p.id)!);
            }
          } else {
            hierarchicalProjects.push(projectMap.get(p.id)!);
          }
        });
        
        hierarchicalProjects.forEach(p => {
            if (p.subProjects && p.subProjects.length > 0) {
                p.subProjects.sort((a, b) => (a.phase_order || 0) - (b.phase_order || 0));
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
      <Card>
        <CardContent className="pt-6">
             <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Completion</TableHead>
                    <TableHead className="w-[140px] text-right">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-9 w-[120px] ml-auto" /></TableCell>
                        </TableRow>
                        ))
                    : projects.map((project) => (
                        <ProjectRow key={project.id} project={project} />
                    ))}
                
                { !loading && projects.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                            You have not been assigned to any projects yet.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
