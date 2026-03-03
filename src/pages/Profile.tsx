import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { userService } from "@/services/userService";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { Post, User } from "@/types";

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ estado de follow
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const isOwnProfile = useMemo(() => {
    if (!id) return true;
    if (!currentUser?.id) return false;
    return String(currentUser.id) === String(id);
  }, [id, currentUser?.id]);

  const userId = useMemo(() => {
    if (isOwnProfile) return currentUser?.id ?? null;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [isOwnProfile, currentUser?.id, id]);

  const resolveAvatarUrl = (u: any) => {
    const raw = u?.user_avatar || u?.avatar || u?.profile_image || null;
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;

    const apiBase = (import.meta.env.VITE_API_URL as string) || "";
    const backendHost = apiBase.replace(/\/api\/?$/, "");
    return `${backendHost}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  // ✅ buscar posts SEMPRE por author=<id>
  const fetchPostsByAuthor = async (authorId: number) => {
    // ajuste para sua assinatura real do postService
    return (postService as any).getPosts({ author: authorId });
  };

  // ✅ detectar se eu já sigo esse usuário (sem depender do backend mandar flag)
  const computeIsFollowing = (targetId: number) => {
    // se seu currentUser já vier com following_ids ou following list
    const cu: any = currentUser as any;
    const list = cu?.following_ids || cu?.following || [];
    if (Array.isArray(list)) {
      // pode ser array de ids ou array de users
      return list.some((x: any) => Number(x?.id ?? x) === Number(targetId));
    }
    return false;
  };

  const loadProfile = async () => {
    if (isOwnProfile && !currentUser?.id) return;

    if (!userId) {
      toast({ title: "Erro", description: "Usuário inválido", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const user = isOwnProfile
        ? (currentUser as User)
        : await userService.getUser(userId);

      setProfileUser(user);

      // follow status
      if (!isOwnProfile) setIsFollowing(computeIsFollowing(userId));

      // posts
      const postsResponse = await postService.getPosts({ author: userId, page: 1 });
      setPosts(Array.isArray(postsResponse?.results) ? postsResponse.results : []);
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

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isOwnProfile, currentUser?.id]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Seguir/Deixar de seguir
  const handleToggleFollow = async () => {
    if (!userId || isOwnProfile) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // ✅ endpoint do backend (veja abaixo em userService)
        await (userService as any).unfollowUser(userId);
        setIsFollowing(false);
        toast({ title: "Ok", description: "Você deixou de seguir." });
      } else {
        await (userService as any).followUser(userId);
        setIsFollowing(true);
        toast({ title: "Ok", description: "Agora você está seguindo!" });
      }

      // ✅ atualiza o currentUser (pra manter estado coerente)
      await refreshUser();

      // ✅ importante: recarrega posts (se o backend só libera após seguir)
      await loadProfile();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o follow",
        variant: "destructive",
      });
    } finally {
      setIsFollowLoading(false);
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

  const avatar = resolveAvatarUrl(profileUser);

  return (
    <Layout>
      <div className="p-4">
        <div className="flex gap-4 items-start justify-between">
          <div className="flex gap-4 items-start">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatar ? `${avatar}?t=${Date.now()}` : undefined}
                  alt={profileUser.username}
                />
                <AvatarFallback>
                  {profileUser.username?.charAt(0)?.toUpperCase() ?? "U"}
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
                    aria-label="Alterar foto do perfil"
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
              <h2 className="text-xl font-bold">@{profileUser.username}</h2>
            </div>
          </div>

          {/* ✅ BOTÃO SEGUIR */}
          {!isOwnProfile && (
            <Button
              onClick={handleToggleFollow}
              disabled={isFollowLoading}
              variant={isFollowing ? "secondary" : "default"}
              className="min-w-[140px]"
            >
              {isFollowLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Aguarde
                </>
              ) : isFollowing ? (
                "Seguindo"
              ) : (
                "Seguir"
              )}
            </Button>
          )}
        </div>

        <div className="mt-6">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma postagem ainda</p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;