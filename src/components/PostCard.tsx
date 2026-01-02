// PostCard Component - Displays a single post with like and comment functionality
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

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (localPost.is_liked) {
        await postService.unlikePost(localPost.id);
        const updatedPost = {
          ...localPost,
          is_liked: false,
          likes_count: localPost.likes_count - 1,
        };
        setLocalPost(updatedPost);
        onPostUpdate?.(updatedPost);
      } else {
        await postService.likePost(localPost.id);
        const updatedPost = {
          ...localPost,
          is_liked: true,
          likes_count: localPost.likes_count + 1,
        };
        setLocalPost(updatedPost);
        onPostUpdate?.(updatedPost);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível processar a ação',
        variant: 'destructive',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentAdded = () => {
    const updatedPost = {
      ...localPost,
      comments_count: localPost.comments_count + 1,
    };
    setLocalPost(updatedPost);
    onPostUpdate?.(updatedPost);
  };

  const timeAgo = formatDistanceToNow(new Date(localPost.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article className="border-b border-border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex gap-3">
        {/* Author Avatar */}
        <Link to={`/profile/${localPost.author.id}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={localPost.author.profile_picture} alt={localPost.author.username} />
            <AvatarFallback>{localPost.author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Author Info and Time */}
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${localPost.author.id}`}
              className="font-semibold hover:underline truncate"
            >
              @{localPost.author.username}
            </Link>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">{timeAgo}</span>
          </div>

          {/* Post Content */}
          <p className="text-foreground whitespace-pre-wrap break-words mb-3">
            {localPost.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 px-2 ${localPost.is_liked ? 'text-red-500' : 'text-muted-foreground'}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${localPost.is_liked ? 'fill-current' : ''}`} />
              )}
              <span>{localPost.likes_count}</span>
            </Button>

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2 text-muted-foreground"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{localPost.comments_count}</span>
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <CommentSection postId={localPost.id} onCommentAdded={handleCommentAdded} />
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
