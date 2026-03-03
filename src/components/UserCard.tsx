// UserCard.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";

interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
  onFollowChange?: (userId: number, isFollowing: boolean) => void;
}

function resolveUserId(u: any): number | null {
  const id = u?.id ?? u?.user_id ?? u?.author_id ?? null;
  return typeof id === "number" && !Number.isNaN(id) ? id : null;
}

function resolveAvatar(u: any): string | undefined {
  return (
    u?.profile_picture ||
    u?.user_avatar ||
    u?.avatar ||
    u?.profile_image ||
    undefined
  );
}

const UserCard: React.FC<UserCardProps> = ({ user, showFollowButton = true, onFollowChange }) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const userId = useMemo(() => resolveUserId(user as any), [user]);
  const username = user?.username ?? "Usuário";
  const avatarUrl = resolveAvatar(user as any);

  const isCurrentUser = currentUser?.id === userId;
  const [isFollowing, setIsFollowing] = useState((user as any)?.is_following ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const profileLink = userId ? `/profile/${userId}` : "/profile";

  const handleFollowToggle = async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(userId, false);
        toast({ title: "Sucesso", description: `Você deixou de seguir @${username}` });
      } else {
        await userService.followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(userId, true);
        toast({ title: "Sucesso", description: `Agora você está seguindo @${username}` });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível processar a ação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Link to={profileLink}>
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={profileLink} className="font-semibold hover:underline block truncate">
          @{username}
        </Link>
        <p className="text-sm text-muted-foreground">
          {(user as any)?.followers_count ?? 0} seguidores
        </p>
      </div>

      {showFollowButton && !isCurrentUser && !!userId && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollowToggle}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? "Seguindo" : "Seguir"}
        </Button>
      )}
    </div>
  );
};

export default UserCard;