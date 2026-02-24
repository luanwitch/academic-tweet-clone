// Profile Page - View and edit user profile
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Camera, Settings } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import UserCard from '@/components/UserCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { userService } from '@/services/userService';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { User, Post } from '@/types';

// Validation schemas
const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username pode conter apenas letras, números e underscore')
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z
  .object({
    old_password: z.string().min(1, 'Senha atual é obrigatória'),
    new_password: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
    new_password_confirm: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'As senhas não coincidem',
    path: ['new_password_confirm'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isOwnProfile = !id || (currentUser && String(currentUser.id) === id);
  const userId = isOwnProfile ? currentUser?.id : Number(id);

  // Profile edit form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '' },
  });

  // Password change form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  // Load profile data
useEffect(() => {
  const loadProfile = async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      const [user, postsResponse, userFollowers, userFollowing] =
        await Promise.all([
          isOwnProfile
            ? Promise.resolve(currentUser!)
            : userService.getUser(userId),
          postService.getPosts(userId),
          userService.getFollowers(userId),
          userService.getFollowing(userId),
        ]);
      setProfileUser(user);
      const normalizedPosts: Post[] = Array.isArray(postsResponse)
        ? postsResponse
        : Array.isArray(postsResponse?.results)
        ? postsResponse.results
        : [];

      setPosts(normalizedPosts);

      // ✅ FOLLOWERS
      const normalizedFollowers: User[] = Array.isArray(userFollowers)
        ? userFollowers
        : Array.isArray(userFollowers?.results)
        ? userFollowers.results
        : [];

      setFollowers(normalizedFollowers);

      // ✅ FOLLOWING
      const normalizedFollowing: User[] = Array.isArray(userFollowing)
        ? userFollowing
        : Array.isArray(userFollowing?.results)
        ? userFollowing.results
        : [];

      setFollowing(normalizedFollowing);

      setIsFollowing(user.is_following ?? false);

      profileForm.reset({ username: user.username });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil',
        variant: 'destructive',
      });

      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

    loadProfile();
  }, [userId, isOwnProfile, currentUser, toast, navigate, profileForm]);

  const handleFollowToggle = async () => {
    if (!profileUser || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollowUser(profileUser.id);
        setIsFollowing(false);
        setProfileUser((prev) =>
          prev ? { ...prev, followers_count: prev.followers_count - 1 } : null
        );
        toast({ title: 'Sucesso', description: `Você deixou de seguir @${profileUser.username}` });
      } else {
        await userService.followUser(profileUser.id);
        setIsFollowing(true);
        setProfileUser((prev) =>
          prev ? { ...prev, followers_count: prev.followers_count + 1 } : null
        );
        toast({ title: 'Sucesso', description: `Agora você está seguindo @${profileUser.username}` });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível processar a ação',
        variant: 'destructive',
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    try {
      await userService.updateProfile({ profile_picture: file });
      await refreshUser();
      toast({ title: 'Sucesso', description: 'Foto de perfil atualizada!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar a foto',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!data.username) return;

    setIsUpdating(true);
    try {
      await userService.updateProfile({ username: data.username });
      await refreshUser();
      setShowEditDialog(false);
      toast({ title: 'Sucesso', description: 'Perfil atualizado!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdating(true);
    try {
      await userService.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      passwordForm.reset();
      setShowEditDialog(false);
      toast({ title: 'Sucesso', description: 'Senha alterada!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível alterar a senha',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Usuário não encontrado</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10">
          <h1 className="text-xl font-bold">Perfil</h1>
        </header>

        {/* Profile Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start gap-4">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileUser.profile_picture} alt={profileUser.username} />
                <AvatarFallback className="text-2xl">
                  {profileUser.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">@{profileUser.username}</h2>
                {isOwnProfile && (
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="profile" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="profile">Perfil</TabsTrigger>
                          <TabsTrigger value="password">Senha</TabsTrigger>
                        </TabsList>
                        <TabsContent value="profile" className="mt-4">
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                              <FormField
                                control={profileForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Salvar
                              </Button>
                            </form>
                          </Form>
                        </TabsContent>
                        <TabsContent value="password" className="mt-4">
                          <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                              <FormField
                                control={passwordForm.control}
                                name="old_password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Senha Atual</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={passwordForm.control}
                                name="new_password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nova Senha</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={passwordForm.control}
                                name="new_password_confirm"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirmar Nova Senha</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Alterar Senha
                              </Button>
                            </form>
                          </Form>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm mb-3">
                <span>
                  <strong>{posts?.length || 0}</strong> Postagens
                </span>
                <span>
                  <strong>{profileUser.followers_count}</strong> seguidores
                </span>
                <span>
                  <strong>{profileUser.following_count}</strong> seguindo
                </span>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Posts, Followers, Following */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger
              value="posts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              Postagens
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              Seguidores
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
            >
              Seguindo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {!posts || posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma postagem ainda</p>
            ) : (
              posts.map((post, index) => (
                <PostCard key={post.id ?? index} post={post} />
              ))
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-0 p-2">
            {followers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum seguidor ainda</p>
            ) : (
              followers.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0 p-2">
            {following.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Não está seguindo ninguém</p>
            ) : (
              following.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
