'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/app/user-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send } from 'lucide-react';
import { getProjectComments, addProjectComment } from '../projects/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string;
    role: string;
    avatar_url: string;
  };
};

const commentSchema = z.object({
  content: z.string().min(1, { message: 'Comment cannot be empty.' }),
});

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

export function ProjectComments({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const { user, profile } = useUser();
  const { toast } = useToast();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });
  
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await getProjectComments(projectId);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching comments',
          description: error,
        });
      } else {
        setComments(data || []);
      }
      setLoading(false);
    };

    fetchComments();
  }, [projectId, toast]);

  useEffect(() => {
    const channel = supabase
      .channel(`project-comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
           if (payload.new.user_id === user?.id) {
            // This user just posted, do nothing as we optimistically updated.
            return;
           }

           const newComment: Comment = {
                ...payload.new,
                user: {
                    // We don't have the user details here without another fetch,
                    // so we'll have to show 'New Comment' or refetch all.
                    // A better approach would be to have a separate user fetch.
                    // For now, let's just add it with what we have.
                    // This part needs improvement for a production app.
                    full_name: 'New User',
                    role: '...',
                    avatar_url: '',
                }
            } as unknown as Comment;
            
            // To get full user details, we'd need another fetch or a more complex subscription
            toast({
                title: 'New Comment',
                description: 'A new comment has been posted. Refresh to see user details.',
            });
            setComments((prev) => [...prev, newComment]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, toast, user?.id]);
  
  useEffect(() => {
    scrollToBottom();
  }, [comments]);


  const onSubmit = async (values: z.infer<typeof commentSchema>) => {
    if (!user || !profile) return;
    setIsPosting(true);

    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      content: values.content,
      created_at: new Date().toISOString(),
      user: {
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
      },
    };

    setComments(prev => [...prev, newComment]);
    form.reset();

    const result = await addProjectComment({
      content: values.content,
      project_id: projectId,
    });
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error posting comment',
        description: result.error,
      });
      // Revert optimistic update
      setComments(prev => prev.filter(c => c.id !== newComment.id));
    }
    
    setIsPosting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Project Discussion</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="h-64 max-h-64 overflow-y-auto pr-4 space-y-6">
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
            ))
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={comment.user?.avatar_url} />
                  <AvatarFallback>{getInitials(comment.user?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{comment.user?.full_name}</span>
                    <span className="text-muted-foreground capitalize">{comment.user?.role}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(comment.created_at), 'PP p')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground pt-12">
              No comments yet. Start the discussion!
            </div>
          )}
          <div ref={commentsEndRef} />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Write a comment..."
                      {...field}
                      rows={1}
                      className="min-h-0"
                       onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                       }}
                    />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPosting}>
                {isPosting ? <Loader2 className="animate-spin" /> : <Send />}
                <span className="sr-only">Post Comment</span>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
