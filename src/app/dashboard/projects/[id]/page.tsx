

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, CircleDollarSign, Percent, Tag, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { Project } from '../page';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import { deleteProject, getProjectById } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/app/user-provider';


const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [subProjects, setSubProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArchiveAlertOpen, setIsArchiveAlertOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { profile } = useUser();

  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        setLoading(true);
        const { data: projectData, error: projectError } = await getProjectById(id as string);

        if (projectError) {
          console.error('Error fetching project:', projectError);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch project details. You may not have the required permissions.'
          })
          setProject(null);
        } else {
          const currentProject = projectData as unknown as Project;
          setProject(currentProject);

          // Fetch sub-projects separately based on permissions
          const { data: childrenData, error: childrenError } = await supabase
            .from('projects')
            .select(`*, users (id, full_name, avatar_url)`)
            .eq('parent_id', currentProject.id);

          if (childrenError) {
            console.error('Error fetching sub-projects:', childrenError);
          } else {
            setSubProjects(childrenData as Project[]);
          }
        }
        
        setLoading(false);
      };
      fetchProject();
    }
  }, [id, toast]);

  const handleArchive = async () => {
    if (!project) return;
    setIsArchiving(true);
    try {
      const result = await deleteProject(project.id);
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Project Deleted',
        description: `Project "${project.name}" has been deleted.`,
      });
      setIsArchiveAlertOpen(false);
      router.push('/dashboard/projects');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error deleting project',
        description: errorMessage,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const canDeleteProject = profile?.role === 'admin' || profile?.role === 'owner';


  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="Project not found" description="This project may not exist or you may not have permission to view it."/>
        <Button onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader title={project.name} description={project.owner}>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/dashboard/projects')} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
            </Button>
            {canDeleteProject && (
             <Button onClick={() => setIsArchiveAlertOpen(true)} variant="destructive" size="sm">
                Delete Project
            </Button>
            )}
          </div>
        </PageHeader>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <Badge
                      variant={
                          project.status === 'Completed' ? 'outline' :
                          project.status === 'Delayed' ? 'destructive' : 'secondary'
                      }
                      className={project.status === 'On Track' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : ''}
                  >
                      {project.status}
                  </Badge>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budget</CardTitle>
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                      }).format(project.budget)}
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Timeline</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-sm font-medium">
                      {format(new Date(project.start_date), 'MMM d, yyyy')} - {format(new Date(project.end_date), 'MMM d, yyyy')}
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{project.completion}%</div>
                  <Progress value={project.completion} className="h-2 mt-1" />
              </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Assigned To</CardTitle>
                </CardHeader>
                <CardContent>
                    {project.users ? (
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={project.users.avatar_url || ''} alt={project.users.full_name || ''} />
                                <AvatarFallback>{getInitials(project.users.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold text-lg">{project.users.full_name}</div>
                                <div className="text-sm text-muted-foreground">Lead for this project</div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">This project is not yet assigned.</p>
                    )}
                </CardContent>
            </Card>

            {subProjects.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Sub-Phases</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phase Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Completion</TableHead>
                                    <TableHead className="w-12"><span className="sr-only">View</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subProjects.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={sub.status === 'Delayed' ? 'destructive' : 'secondary'}>{sub.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{sub.completion}%</TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                                <Link href={`/dashboard/tasks/${sub.id}`}>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

       <AlertDialog open={isArchiveAlertOpen} onOpenChange={setIsArchiveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold"> {project.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? <Loader2 className="animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
