import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formBio, setFormBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const isOwnProfile = useMemo(() => {
    if (!id) return true;
    if (!currentUser?.id) return false;
    return String(currentUser.id) === String(id);
  }, [id, currentUser?.id]);

  const userId = useMemo(() => {
    if (isOwnProfile) return currentUser?.id ?? null;

    const parsed = Number(id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [id, isOwnProfile, currentUser?.id]);

  const resolveAvatarUrl = (user: Partial<User> & Record<string, unknown>) => {
    const raw =
      (user.user_avatar as string | undefined) ||
      (user.avatar as string | undefined) ||
      (user.profile_image as string | undefined) ||
      null;

    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;

    const apiBase = (import.meta.env.VITE_API_URL as string) || "";
    const backendHost = apiBase.replace(/\/api\/?$/, "");

    return `${backendHost}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const computeIsFollowing = (targetId: number) => {
    const cu = currentUser as (User & Record<string, unknown>) | null;
    const list =
      (cu?.following_ids as unknown[]) ||
      (cu?.following as unknown[]) ||
      [];

    if (!Array.isArray(list)) return false;

    return list.some((item) => {
      if (typeof item === "object" && item !== null && "id" in item) {
        return Number((item as { id: number }).id) === Number(targetId);
      }
      return Number(item) === Number(targetId);
    });
  };

  const loadProfile = useCallback(async () => {
    if (isOwnProfile && !currentUser?.id) return;

    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário inválido",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsLoading(true);

    try {
      const user = isOwnProfile
        ? await userService.getMe()
        : await userService.getUser(userId);

      setProfileUser(user);
      setFormUsername(user.username ?? "");
      setFormBio(user.bio ?? "");

      if (!isOwnProfile) {
        if (typeof user.is_following === "boolean") {
          setIsFollowing(user.is_following);
        } else {
          setIsFollowing(computeIsFollowing(userId));
        }
      }

      const authorPosts = await postService.getPostsByAuthorList(userId, 1);
      setPosts(authorPosts);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }, [isOwnProfile, currentUser?.id, userId, toast, navigate]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);

    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      await loadProfile();

      toast({
        title: "Sucesso",
        description: "Foto atualizada!",
      });
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async () => {
    const trimmedUsername = formUsername.trim();
    const trimmedBio = formBio.trim();

    if (!trimmedUsername) {
      toast({
        title: "Erro",
        description: "O nome de usuário não pode ficar vazio.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedUser = await userService.updateProfile({
        username: trimmedUsername,
        bio: trimmedBio,
      });

      setProfileUser(updatedUser);
      await refreshUser();
      setIsEditing(false);

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!userId || isOwnProfile) return;

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        await userService.unfollowUser(userId);
        setIsFollowing(false);
        toast({
          title: "Ok",
          description: "Você deixou de seguir.",
        });
      } else {
        await userService.followUser(userId);
        setIsFollowing(true);
        toast({
          title: "Ok",
          description: "Agora você está seguindo!",
        });
      }

      await refreshUser();
      await loadProfile();
    } catch (error) {
      console.error("Erro ao alterar follow:", error);
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

  const avatar = resolveAvatarUrl(
    profileUser as Partial<User> & Record<string, unknown>
  );

  return (
    <Layout>
      <div className="p-4">
        <div className="flex gap-4 items-start justify-between">
          <div className="flex gap-4 items-start flex-1">
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
                    type="button"
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

            <div className="flex-1">
              {isOwnProfile && isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nome de usuário
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                      placeholder="Seu nome de usuário"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                      value={formBio}
                      onChange={(e) => setFormBio(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none min-h-[90px]"
                      placeholder="Fale um pouco sobre você"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      type="button"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Salvando
                        </>
                      ) : (
                        "Salvar"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormUsername(profileUser.username ?? "");
                        setFormBio(profileUser.bio ?? "");
                        setIsEditing(false);
                      }}
                      disabled={isSavingProfile}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold">@{profileUser.username}</h2>

                  {profileUser.bio ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {profileUser.bio}
                    </p>
                  ) : null}

                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                    <span>{profileUser.followers_count ?? 0} seguidores</span>
                    <span>{profileUser.following_count ?? 0} seguindo</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {isOwnProfile ? (
            <Button
              type="button"
              variant={isEditing ? "outline" : "default"}
              onClick={() => {
                if (isEditing) {
                  setFormUsername(profileUser.username ?? "");
                  setFormBio(profileUser.bio ?? "");
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? "Fechar edição" : "Editar perfil"}
            </Button>
          ) : (
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