'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { type Project } from './page';
import { deleteProject } from './actions';
import { EditProjectForm } from './edit-project-form';
import { useUser } from '@/app/user-provider';

export function ProjectActions({ project }: { project: Project }) {
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useUser();
  const [isArchiveAlertOpen, setIsArchiveAlertOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleArchive = async () => {
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
      // No need to call router.refresh(), revalidation should handle it.
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

  const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const isAssignedPMC = profile?.role === 'pmc' && project.users?.id === profile.id;

  const canEdit = isOwnerOrAdmin || isAssignedPMC;
  const canDelete = isOwnerOrAdmin;
  const canViewDetails = !!profile; // Any logged in user can view details

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {canViewDetails && (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
              View Details
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setIsArchiveAlertOpen(true)}
              >
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit && (
        <EditProjectForm project={project} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
      )}

      <AlertDialog open={isArchiveAlertOpen} onOpenChange={setIsArchiveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold"> {project.name}</span> and all its associated tasks and sub-projects.
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
