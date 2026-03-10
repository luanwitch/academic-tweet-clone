import React, { useEffect, useMemo, useState } from "react";
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
  currentUserId?: number;
  onPostUpdate?: (updatedPost: Post) => void;
  onPostDelete?: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onPostUpdate,
  onPostDelete,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>(post.content ?? "");
  const { toast } = useToast();

  useEffect(() => {
    setLocalPost(post);
    setEditContent(post.content ?? "");
  }, [post]);

  const resolved = useMemo(() => {
    const p: any = localPost;

    const author = p?.user ?? p?.author ?? null;

    const rawAuthorId =
    typeof author === "number"
    ? author
    : author?.id ??
      p?.user_id ??
      p?.author_id ??
      (typeof p?.user === "number" ? p.user : p?.user?.id) ??
      (typeof p?.author === "number" ? p.author : p?.author?.id) ??
      null;

    const authorIdNum =
      rawAuthorId !== null &&
      rawAuthorId !== undefined &&
      rawAuthorId !== "" &&
      !Number.isNaN(Number(rawAuthorId))
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

  const isOwner =
    currentUserId !== undefined &&
    currentUserId !== null &&
    resolved.authorId !== null &&
    Number(currentUserId) === Number(resolved.authorId);

    console.log("currentUserId:", currentUserId);
    console.log("resolved.authorId:", resolved.authorId);
    console.log("localPost:", localPost);
    console.log("isOwner:", isOwner);

  const timeAgo = localPost?.created_at
    ? formatDistanceToNow(new Date(localPost.created_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : "";

const handleLike = async () => {
  if (isLiking) return;

  console.log("Iniciando like/unlike do post:", localPost.id);
  setIsLiking(true);

  try {
    if (localPost.is_liked) {
      await postService.unlikePost(localPost.id);
      console.log("Unlike OK");

      const updatedPost: Post = {
        ...localPost,
        is_liked: false,
        likes_count: Math.max(0, (localPost.likes_count || 0) - 1),
      };

      setLocalPost(updatedPost);
      onPostUpdate?.(updatedPost);
    } else {
      await postService.likePost(localPost.id);
      console.log("Like OK");

      const updatedPost: Post = {
        ...localPost,
        is_liked: true,
        likes_count: (localPost.likes_count || 0) + 1,
      };

      setLocalPost(updatedPost);
      onPostUpdate?.(updatedPost);
    }
  } catch (error) {
    console.error("Erro no like:", error);
    toast({
      title: "Erro",
      description: "Não foi possível processar o like",
      variant: "destructive",
    });
  } finally {
    setIsLiking(false);
  }
};

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm("Tem certeza que deseja excluir este post?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await postService.deletePost(localPost.id);

      toast({
        title: "Sucesso",
        description: "Post excluído com sucesso",
      });

      onPostDelete?.(localPost.id);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = async () => {
    const content = editContent.trim();

    if (!content) {
      toast({
        title: "Erro",
        description: "O conteúdo do post não pode ficar vazio",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedPost = await postService.updatePost(localPost.id, content);

      setLocalPost(updatedPost);
      setEditContent(updatedPost.content);
      setIsEditing(false);

      toast({
        title: "Sucesso",
        description: "Post atualizado com sucesso",
      });

      onPostUpdate?.(updatedPost);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível editar o post",
        variant: "destructive",
      });
    }
  };

  const handleEditCancel = () => {
    setEditContent(localPost.content);
    setIsEditing(false);
  };

  const handleCommentAdded = () => {
    const updatedPost: Post = {
      ...localPost,
      comments_count: (localPost.comments_count || 0) + 1,
    };

    setLocalPost(updatedPost);
    onPostUpdate?.(updatedPost);
  };

  const profileHref = resolved.authorId ? `/profile/${resolved.authorId}` : null;

  const AuthorAvatar = (
    <Avatar className="h-12 w-12 border border-border">
      <AvatarImage
        src={resolved.avatarUrl ?? undefined}
        alt={resolved.authorName}
      />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {resolved.authorName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <article className="border-b border-border p-4 hover:bg-muted/50 transition-colors w-full bg-white dark:bg-transparent">
      <div className="flex gap-3">
        {profileHref ? <Link to={profileHref}>{AuthorAvatar}</Link> : AuthorAvatar}

        <div className="flex-1 min-w-0">
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

          {true && !isEditing && (
            <div className="mb-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          )}

          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-md border border-border p-3 text-sm text-foreground"
                rows={4}
              />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleEditSave}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={handleEditCancel}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground text-[15px] whitespace-pre-wrap break-words mb-3 leading-normal">
              {localPost.content}
            </p>
          )}

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
                <Heart
                  className={`h-4 w-4 ${localPost.is_liked ? "fill-current" : ""}`}
                />
              )}
              <span className="text-xs font-medium">
                {localPost.likes_count || 0}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-500"
              onClick={() => setShowComments((v) => !v)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">
                {localPost.comments_count || 0}
              </span>
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