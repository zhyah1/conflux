'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Building, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AddProjectForm } from './add-project-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectActions } from './project-actions';
import { getProjects } from './actions';
import { useUser } from '@/app/user-provider';

export type User = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  owner: string;
  budget: number;
  completion: number;
  start_date: string;
  end_date: string;
  parent_id: string | null;
  users: User | null; // Can be a user object or null
  subProjects?: Project[];
};

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

const ProjectRow = ({ project, level = 0 }: { project: Project; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubProjects = project.subProjects && project.subProjects.length > 0;

  return (
    <>
      <TableRow key={project.id}>
        <TableCell style={{ paddingLeft: `${level * 2}rem` }}>
          <div className="flex items-center gap-2">
             {hasSubProjects ? (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
               <span className="w-6 h-6" /> // Placeholder for alignment
            )}
            {level === 0 ? <Folder className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground" />}
            <div className="font-medium">
              {project.name}
              {level === 0 && <div className="text-sm text-muted-foreground">{project.owner}</div>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant={
              project.status === 'Completed'
                ? 'outline'
                : project.status === 'Delayed'
                ? 'destructive'
                : 'secondary'
            }
            className={project.status === 'On Track' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : ''}
          >
            {project.status}
          </Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }).format(project.budget)}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {project.users ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={project.users.avatar_url || ''} alt={project.users.full_name || ''} />
                <AvatarFallback>{getInitials(project.users.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{project.users.full_name}</div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="flex items-center gap-2">
             <Progress value={project.completion} className="h-2" />
             <span>{project.completion}%</span>
          </div>
        </TableCell>
        <TableCell>
          <ProjectActions project={project} />
        </TableCell>
      </TableRow>
      {isExpanded && hasSubProjects && project.subProjects?.map(sub => (
          <ProjectRow key={sub.id} project={sub} level={level + 1} />
      ))}
    </>
  );
};


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUser();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await getProjects();
      if (!error && data) {
        const allProjects = data as unknown as Project[];
        // Create a map for easy lookup
        const projectMap = new Map(allProjects.map(p => [p.id, { ...p, subProjects: [] }]));
        
        const hierarchicalProjects: Project[] = [];

        allProjects.forEach(p => {
          if (p.parent_id && projectMap.has(p.parent_id)) {
            const parent = projectMap.get(p.parent_id);
            parent?.subProjects?.push(projectMap.get(p.id)!);
          } else {
            hierarchicalProjects.push(projectMap.get(p.id)!);
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
  
  const canAddProject = profile?.role === 'admin' || profile?.role === 'pmc';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="Manage all your master projects and their sub-phases."
      >
        {canAddProject && (
          <AddProjectForm allProjects={projects}>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Project
            </Button>
          </AddProjectForm>
        )}
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Budget</TableHead>
                <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                <TableHead className="hidden md:table-cell">Completion</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                projects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
