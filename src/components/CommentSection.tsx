// CommentSection Component - Displays and adds comments to a post
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/types';

interface CommentSectionProps {
  postId: number;
  onCommentAdded?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentAdded }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await postService.getComments(postId);
        setComments(data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os comentários',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [postId, toast]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await postService.addComment(postId, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      onCommentAdded?.();
      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível adicionar o comentário',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
        <Textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] resize-none"
          maxLength={280}
        />
        <Button type="submit" size="icon" disabled={!newComment.trim() || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-2">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Link to={`/profile/${comment.author.id}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.profile_picture} alt={comment.author.username} />
                  <AvatarFallback>{comment.author.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 bg-muted rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/profile/${comment.author.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    @{comment.author.username}
                  </Link>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
