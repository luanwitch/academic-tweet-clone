import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onPostUpdate?: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const { toast } = useToast();

  // CORREÇÃO: Removida a trava do !localPost.author
  if (!localPost) return null;

  // Pegamos os dados do autor com segurança (Django envia username direto no post às vezes)
  const authorName = localPost.username || (localPost.author as any)?.username || 'Usuário';
  const authorId = (localPost.author as any)?.id || localPost.user_id || localPost.id;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (localPost.is_liked) {
        await postService.unlikePost(localPost.id);
        const updatedPost = {
          ...localPost,
          is_liked: false,
          likes_count: Math.max(0, (localPost.likes_count || 0) - 1),
        };
        setLocalPost(updatedPost);
        onPostUpdate?.(updatedPost);
      } else {
        await postService.likePost(localPost.id);
        const updatedPost = {
          ...localPost,
          is_liked: true,
          likes_count: (localPost.likes_count || 0) + 1,
        };
        setLocalPost(updatedPost);
        onPostUpdate?.(updatedPost);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o like',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentAdded = () => {
    const updatedPost = {
      ...localPost,
      comments_count: (localPost.comments_count || 0) + 1,
    };
    setLocalPost(updatedPost);
    onPostUpdate?.(updatedPost);
  };

  // Proteção para a data
  const timeAgo = localPost.created_at 
    ? formatDistanceToNow(new Date(localPost.created_at), { addSuffix: true, locale: ptBR })
    : '';

  return (
    <article className="border-b border-border p-4 hover:bg-muted/50 transition-colors w-full bg-white dark:bg-transparent">
      <div className="flex gap-3">
        
        {/* Avatar */}
        <Link to={`/profile/${authorId}`}>
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage
              src={(localPost.author as any)?.profile_picture || ''}
              alt={authorName}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Author + Time */}
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${authorId}`}
              className="font-bold hover:underline truncate text-foreground"
            >
              @{authorName}
            </Link>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
          </div>

          {/* Conteúdo */}
          <p className="text-foreground text-[15px] whitespace-pre-wrap break-words mb-3 leading-normal">
            {localPost.content}
          </p>

          {/* Ações */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 px-2 hover:bg-red-50 hover:text-red-500 transition-colors ${
                localPost.is_liked ? 'text-red-500' : 'text-muted-foreground'
              }`}
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${localPost.is_liked ? 'fill-current' : ''}`} />
              )}
              <span className="text-xs font-medium">{localPost.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-500"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{localPost.comments_count || 0}</span>
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-border">
              <CommentSection
                postId={localPost.id}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;