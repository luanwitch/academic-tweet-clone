import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/types";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: Post;
  onPostUpdate?: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);
  const { toast } = useToast();

  // ✅ Resolve autor compatível: backend novo -> post.user | frontend antigo -> post.author
  const resolved = useMemo(() => {
    const p: any = localPost as any;

    const author = p?.user ?? p?.author ?? null;

    const rawAuthorId =
      author?.id ??
      p?.user_id ??
      p?.author_id ??
      p?.user?.id ??
      p?.author?.id ??
      null;

    const authorIdNum =
      rawAuthorId !== null && rawAuthorId !== undefined && rawAuthorId !== ""
        ? Number(rawAuthorId)
        : null;

    const authorId =
      authorIdNum && Number.isFinite(authorIdNum) && authorIdNum > 0
        ? authorIdNum
        : null;

    const authorName =
      author?.username ??
      p?.username ??
      p?.user?.username ??
      p?.author?.username ??
      "Usuário";

    const avatarUrl =
      author?.user_avatar ??
      author?.avatar ??
      author?.profile_image ??
      author?.profile_picture ??
      p?.user_avatar ??
      p?.avatar ??
      p?.profile_image ??
      p?.profile_picture ??
      null;

    return { authorId, authorName, avatarUrl };
  }, [localPost]);

  const timeAgo = localPost?.created_at
    ? formatDistanceToNow(new Date(localPost.created_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : "";

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (localPost.is_liked) {
        await postService.unlikePost(localPost.id);

        const updatedPost: Post = {
          ...localPost,
          is_liked: false,
          likes_count: Math.max(0, (localPost.likes_count || 0) - 1),
        };

        setLocalPost(updatedPost);
        onPostUpdate?.(updatedPost);
      } else {
        await postService.likePost(localPost.id);

        const updatedPost: Post = {
          ...localPost,
          is_liked: true,
          likes_count: (localPost.likes_count || 0) + 1,
        };

        setLocalPost(updatedPost);
        onPostUpdate?.(updatedPost);
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível processar o like",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentAdded = () => {
    const updatedPost: Post = {
      ...localPost,
      comments_count: (localPost.comments_count || 0) + 1,
    };

    setLocalPost(updatedPost);
    onPostUpdate?.(updatedPost);
  };

  // ✅ só cria o link se tiver authorId válido
  const profileHref = resolved.authorId ? `/profile/${resolved.authorId}` : null;

  const AuthorAvatar = (
    <Avatar className="h-12 w-12 border border-border">
      <AvatarImage src={resolved.avatarUrl ?? undefined} alt={resolved.authorName} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {resolved.authorName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <article className="border-b border-border p-4 hover:bg-muted/50 transition-colors w-full bg-white dark:bg-transparent">
      <div className="flex gap-3">
        {/* Avatar + link do autor (se tiver id) */}
        {profileHref ? (
          <Link to={profileHref}>{AuthorAvatar}</Link>
        ) : (
          AuthorAvatar
        )}

        <div className="flex-1 min-w-0">
          {/* Author + Time */}
          <div className="flex items-center gap-2 mb-1">
            {profileHref ? (
              <Link
                to={profileHref}
                className="font-bold hover:underline truncate text-foreground"
              >
                @{resolved.authorName}
              </Link>
            ) : (
              <span className="font-bold truncate text-foreground">
                @{resolved.authorName}
              </span>
            )}

            {timeAgo ? (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs">{timeAgo}</span>
              </>
            ) : null}
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
                localPost.is_liked ? "text-red-500" : "text-muted-foreground"
              }`}
              onClick={handleLike}
              disabled={isLiking}
            >
              {isLiking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${localPost.is_liked ? "fill-current" : ""}`} />
              )}
              <span className="text-xs font-medium">{localPost.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-500"
              onClick={() => setShowComments((v) => !v)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{localPost.comments_count || 0}</span>
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-border">
              <CommentSection postId={localPost.id} onCommentAdded={handleCommentAdded} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;