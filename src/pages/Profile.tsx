// Profile Page - View and edit user profile
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Camera, Settings } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import UserCard from "@/components/UserCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { userService } from "@/services/userService";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { User, Post } from "@/types";

const profileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional()
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwnProfile =
    !id || (currentUser && String(currentUser.id) === id);
  const userId = isOwnProfile ? currentUser?.id : Number(id);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "" },
  });

  // 🔥 RESOLVE AVATAR CORRETO
  const resolveAvatarUrl = (u: any) => {
    const raw =
      u?.user_avatar ||
      u?.avatar ||
      u?.profile_image ||
      null;

    if (!raw) return undefined;

    if (/^https?:\/\//i.test(raw)) return raw;

    const apiBase = import.meta.env.VITE_API_URL as string;
    const backendHost = apiBase.replace(/\/api\/?$/, "");
    return `${backendHost}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

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

        setPosts(
          Array.isArray(postsResponse?.results)
            ? postsResponse.results
            : []
        );

        setFollowers(
          Array.isArray(userFollowers?.results)
            ? userFollowers.results
            : []
        );

        setFollowing(
          Array.isArray(userFollowing?.results)
            ? userFollowing.results
            : []
        );

        profileForm.reset({ username: user.username });
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o perfil",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, isOwnProfile, currentUser]);

  // 🔥 UPLOAD CORRETO
  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);
    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      toast({ title: "Sucesso", description: "Foto atualizada!" });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !profileUser) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4">
        <div className="flex gap-4 items-start">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={
                  resolveAvatarUrl(profileUser)
                    ? `${resolveAvatarUrl(profileUser)}?t=${Date.now()}`
                    : undefined
                }
                alt={profileUser.username}
              />
              <AvatarFallback>
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
                  className="absolute bottom-0 right-0 bg-primary p-2 rounded-full"
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

          <div>
            <h2 className="text-xl font-bold">
              @{profileUser.username}
            </h2>
          </div>
        </div>

        <div className="mt-6">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma postagem ainda
            </p>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;