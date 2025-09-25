'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { PageHeader } from '../components/page-header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AddProjectForm } from './add-project-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
  owner: string;
  budget: number;
  completion: number;
  users: User | null; // Can be a user object or null
};

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .order('start_date', { ascending: false });

      if (!error) {
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
        title="Projects"
        description="Manage all your master projects."
      >
        <AddProjectForm>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Project
          </Button>
        </AddProjectForm>
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
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                      <div className="text-sm text-muted-foreground">{project.owner}</div>
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
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
