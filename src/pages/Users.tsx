import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getAuthToken } from "@/services/api";

type ApiUser = {
  id: number;
  username: string;
  email?: string;
  avatar?: string | null;
  is_following?: boolean;
  followers_count?: number;
  following_count?: number;
};

const Users: React.FC = () => {
  const { toast } = useToast();
  const auth = useAuth() as any;

  const meId =
    Number(auth?.user?.user_id ?? auth?.user?.id ?? auth?.user_id ?? auth?.id) || null;

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ApiUser[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    console.log("[Users] token:", getAuthToken());
    console.log("[Users] meId:", meId);
  }, [meId]);

  const applyItems = (list: ApiUser[]) => {
    const filtered = meId ? list.filter((u) => u.id !== meId) : list;

    setItems(filtered);
    setFollowingMap((prev) => {
      const next = { ...prev };

      for (const u of filtered) {
        if (typeof u.is_following === "boolean") {
          next[u.id] = u.is_following;
        } else if (next[u.id] === undefined) {
          next[u.id] = false;
        }
      }

      return next;
    });
  };

  const loadInitial = async () => {
    setLoading(true);

    try {
      const data = await apiRequest<{ results?: ApiUser[] } | ApiUser[]>("/users/", {
        method: "GET",
        auth: true,
      });

      const list: ApiUser[] = Array.isArray(data) ? data : data?.results || [];
      applyItems(list);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível listar usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (term: string) => {
    const searchTerm = term.trim();

    if (!searchTerm) {
      return loadInitial();
    }

    setLoading(true);

    try {
      const data = await apiRequest<ApiUser[] | { results?: ApiUser[] }>(
        `/users/search/?q=${encodeURIComponent(searchTerm)}`,
        {
          method: "GET",
          auth: true,
        }
      );

      const list: ApiUser[] = Array.isArray(data) ? data : data?.results || [];
      applyItems(list);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      searchUsers(q);
    }, 350);

    return () => window.clearTimeout(id);
  }, [q]);

  const follow = async (userId: number) => {
    try {
      const token = getAuthToken();

      if (!token) {
        toast({
          title: "Sem login",
          description: "Seu token não está salvo. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      setBusyId(userId);

      await apiRequest(`/users/${userId}/follow/`, {
        method: "POST",
        auth: true,
      });

      setFollowingMap((prev) => ({ ...prev, [userId]: true }));
    } catch (error) {
      console.error("Erro ao seguir usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível seguir esse usuário.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const unfollow = async (userId: number) => {
    try {
      const token = getAuthToken();

      if (!token) {
        toast({
          title: "Sem login",
          description: "Seu token não está salvo. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      setBusyId(userId);

      await apiRequest(`/users/${userId}/follow/`, {
        method: "DELETE",
        auth: true,
      });

      setFollowingMap((prev) => ({ ...prev, [userId]: false }));
    } catch (error) {
      console.error("Erro ao deixar de seguir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deixar de seguir esse usuário.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10">
          <h1 className="text-xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Pesquise e siga pessoas para ver o feed só de quem você segue.
          </p>

          <div className="mt-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por username..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </header>

        {loading ? (
          <div className="p-6 text-muted-foreground">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-muted-foreground">Nenhum usuário.</div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((u) => {
              const isFollowing = Boolean(followingMap[u.id]);
              const isBusy = busyId === u.id;

              return (
                <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {u.username?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold">@{u.username}</div>
                      {u.email ? (
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      ) : null}
                    </div>
                  </div>

                  {isFollowing ? (
                    <button
                      disabled={isBusy}
                      onClick={() => unfollow(u.id)}
                      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
                    >
                      {isBusy ? "Aguarde..." : "Deixar de seguir"}
                    </button>
                  ) : (
                    <button
                      disabled={isBusy}
                      onClick={() => follow(u.id)}
                      className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {isBusy ? "Aguarde..." : "Seguir"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;