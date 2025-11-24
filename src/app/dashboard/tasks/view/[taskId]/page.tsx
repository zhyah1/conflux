'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar, Paperclip, Pencil, Send, MoreHorizontal, User, Tag, Clock, CheckCircle, Loader2, ArrowLeft, Download, File as FileIcon, Eye } from 'lucide-react';
import { useUser, type UserProfile } from '@/app/user-provider';
import { format, isPast } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { addTaskComment, getTaskById, getTaskComments, getTaskAttachments, getTaskAttachmentSignedUrl } from '../../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../components/page-header';
import { EditTaskForm } from '../../edit-task-form';
import { UploadAttachmentForm } from '../../upload-attachment-form';
import { getDynamicStatus } from '@/lib/utils';

type User = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  users: User | null; 
  approver_id: string | null;
  description: string | null;
  due_date: string | null;
  start_date: string | null;
  progress: number | null;
  completion: number;
};


const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user: UserProfile;
};

type Attachment = {
  id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { user, profile } = useUser();
  const { toast } = useToast();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await getTaskComments(taskId);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching comments',
          description: error,
        });
      } else {
        setComments(data as Comment[]);
      }
      setLoading(false);
    };

    fetchComments();
  }, [taskId, toast]);

   useEffect(() => {
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
           if (payload.new.user_id === user?.id) {
            return;
           }
           // Fetch the full user details for the new comment
           const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', payload.new.user_id).single();
           if (userError) {
                console.error("Error fetching user for new comment", userError);
                return;
           }

           const newComment: Comment = {
                ...payload.new,
                user: userData
            } as unknown as Comment;

            setComments((prev) => [...prev, newComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, toast, user?.id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !profile) return;
    setIsPosting(true);

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment,
      created_at: new Date().toISOString(),
      user: profile,
    };

    setComments(prev => [...prev, optimisticComment]);
    setNewComment('');

    const result = await addTaskComment({
      content: optimisticComment.content,
      task_id: taskId,
    });
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error posting comment',
        description: result.error,
      });
      // Revert optimistic update
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
    }
    setIsPosting(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comments ({comments.length})</h3>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
            <Textarea 
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isPosting}
            />
            <Button onClick={handlePostComment} disabled={isPosting || !newComment.trim()}>
                {isPosting ? <Loader2 className="animate-spin" /> : <Send />}
                Comment
            </Button>
        </div>
      </div>
      <div className="space-y-6">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user?.avatar_url} />
                <AvatarFallback>{getInitials(comment.user?.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{comment.user?.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), 'PP p')}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-4">No comments yet.</p>
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  )
}

function TaskAttachments({ taskId, onUploadSuccess }: { taskId: string, onUploadSuccess: () => void }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAttachments() {
      setLoading(true);
      const { data, error } = await getTaskAttachments(taskId);
      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching attachments', description: error });
      } else {
        setAttachments(data || []);
      }
      setLoading(false);
    }
    fetchAttachments();
  }, [taskId, toast, onUploadSuccess]);

  const handleFileAction = async (attachment: Attachment) => {
    try {
      const { data, error } = await getTaskAttachmentSignedUrl(attachment.file_path);
      if (error || !data?.signedUrl) {
        throw new Error(error || 'Could not get attachment URL.');
      }
      window.open(data.signedUrl, '_blank');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm flex items-center gap-2"><Paperclip className="w-4 h-4" />Attachments</h4>
        <UploadAttachmentForm taskId={taskId} onUploadSuccess={onUploadSuccess}>
          <Button variant="outline" size="sm">Add attachment</Button>
        </UploadAttachmentForm>
      </div>
       <div className="bg-background rounded-lg p-4 border border-dashed">
         {loading ? (
           <Skeleton className="h-10 w-full" />
         ) : attachments.length > 0 ? (
           <ul className="space-y-2">
            {attachments.map(att => (
              <li key={att.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate" title={att.file_name}>{att.file_name}</span>
                </div>
                <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFileAction(att)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFileAction(att)}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
              </li>
            ))}
           </ul>
         ) : (
            <p className="text-sm text-center text-muted-foreground">No attachments</p>
         )}
      </div>
    </div>
  );
}


export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchTask = async () => {
    if (!taskId) return;
    setLoading(true);
    const { data, error } = await getTaskById(taskId);
    if (error) {
        console.error(error);
        setTask(null);
    } else {
        setTask(data as Task);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTask();
  }, [taskId, refreshTrigger]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8"/></div>
  }
  
  if (!task) {
    return (
        <div className="text-center">
            <PageHeader title="Task not found" description="This task may not exist or you may not have permission to view it."/>
            <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
            </Button>
      </div>
    );
  }

  const isOverdue = task.due_date ? isPast(new Date(task.due_date)) && task.status !== 'Done' : false;
  const dynamicStatus = getDynamicStatus({
      ...task,
      end_date: task.due_date,
      completion: task.progress || 0
  })

  return (
    <div className="flex flex-col gap-6">
        <PageHeader title={task.id} description={task.title}>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/dashboard/tasks/board/${task.project_id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to Board
                </Button>
                <EditTaskForm task={task}>
                    <Button variant="outline"><Pencil className="mr-2 h-4 w-4"/>Edit</Button>
                </EditTaskForm>
                <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
            </div>
        </PageHeader>
        <Card>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="md:col-span-2 p-6 space-y-6">
                        <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">
                            {task.description || 'No description provided.'}
                        </p>
                        </div>
                        <Separator />
                        <TaskComments taskId={task.id} />
                    </div>

                    <div className="col-span-1 border-l bg-muted/30 p-6 space-y-6">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><Tag className="w-4 h-4" />Status</h4>
                            <Badge variant={dynamicStatus.status === 'Done' ? 'secondary' : 'default'}>{dynamicStatus.status}</Badge>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><Clock className="w-4 h-4" />Priority</h4>
                            <p className="text-sm">{task.priority}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4" />Assignee</h4>
                            {task.users ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={task.users.avatar_url || ''} />
                                        <AvatarFallback>{getInitials(task.users.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{task.users.full_name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{task.users.role}</p>
                                    </div>
                                </div>
                            ) : <p className="text-sm text-muted-foreground">Unassigned</p>}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><Calendar className="w-4 h-4" />Due Date</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-sm">{task.due_date ? format(new Date(task.due_date), 'PPP') : 'Not set'}</p>
                                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />Progress</h4>
                            <div className="text-sm">{dynamicStatus.completion}% complete</div>
                            <Progress value={dynamicStatus.completion} className="h-2"/>
                        </div>
                        <TaskAttachments taskId={task.id} onUploadSuccess={() => setRefreshTrigger(c => c + 1)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
