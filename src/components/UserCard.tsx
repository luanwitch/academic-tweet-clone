// UserCard Component - Displays user info with follow button
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
  onFollowChange?: (userId: number, isFollowing: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = true,
  onFollowChange,
}) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.is_following ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isCurrentUser = currentUser?.id === user.id;

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(user.id);
        setIsFollowing(false);
        onFollowChange?.(user.id, false);
        toast({
          title: 'Sucesso',
          description: `Você deixou de seguir @${user.username}`,
        });
      } else {
        await userService.followUser(user.id);
        setIsFollowing(true);
        onFollowChange?.(user.id, true);
        toast({
          title: 'Sucesso',
          description: `Agora você está seguindo @${user.username}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível processar a ação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <Link to={`/profile/${user.id}`}>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.profile_picture} alt={user.username} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.id}`} className="font-semibold hover:underline block truncate">
          @{user.username}
        </Link>
        <p className="text-sm text-muted-foreground">
          {user.followers_count} seguidores
        </p>
      </div>

      {showFollowButton && !isCurrentUser && (
        <Button
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          onClick={handleFollowToggle}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFollowing ? (
            'Seguindo'
          ) : (
            'Seguir'
          )}
        </Button>
      )}
    </div>
  );
};

export default UserCard;
