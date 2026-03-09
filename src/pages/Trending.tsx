import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import CreatePostForm from "@/components/CreatePostForm";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/types";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 10;

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const { user } = useAuth();
  const { toast } = useToast();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const didMountSearchRef = useRef(false);

  const normalizeResponse = useCallback((data: unknown) => {
    if (Array.isArray(data)) {
      return { normalizedPosts: data as Post[], hasNext: false };
    }

    if (
      data &&
      typeof data === "object" &&
      "results" in data &&
      Array.isArray((data as { results: Post[] }).results)
    ) {
      const typedData = data as { results: Post[]; next?: string | null };

      return {
        normalizedPosts: typedData.results,
        hasNext: Boolean(typedData.next),
      };
    }

    return { normalizedPosts: [], hasNext: false };
  }, []);

  const loadPage = useCallback(
    async (
      pageToLoad: number,
      mode: "replace" | "append",
      term: string = ""
    ) => {
      try {
        let normalizedPosts: Post[] = [];
        let nextPageExists = false;
        const trimmedTerm = term.trim();

        if (trimmedTerm) {
          const response = await postService.searchPosts(trimmedTerm, pageToLoad);
          const normalized = normalizeResponse(response);
          normalizedPosts = normalized.normalizedPosts;
          nextPageExists = normalized.hasNext;
        } else {
          const response = await postService.getFeed(pageToLoad, PAGE_SIZE);
          const normalized = normalizeResponse(response);
          normalizedPosts = normalized.normalizedPosts;
          nextPageExists = normalized.hasNext;
        }

        setHasMore(nextPageExists);
        setPage(pageToLoad);
        setPosts((prev) =>
          mode === "replace" ? normalizedPosts : [...prev, ...normalizedPosts]
        );
      } catch {
        toast({
          title: "Erro ao carregar posts",
          description: "Não foi possível carregar os posts.",
          variant: "destructive",
        });
      }
    },
    [normalizeResponse, toast]
  );

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setHasMore(false);
      setPage(1);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        await loadPage(1, "replace", "");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [user, loadPage]);

  useEffect(() => {
    if (!user) return;

    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        await loadPage(1, "replace", searchTerm);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [searchTerm, user, loadPage]);

  const handlePostCreated = (newPost: Post) => {
    const trimmedSearch = searchTerm.trim().toLowerCase();

    if (trimmedSearch) {
      const matchesSearch = newPost.content
        ?.toLowerCase()
        .includes(trimmedSearch);

      if (!matchesSearch) return;
    }

    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      await loadPage(page + 1, "append", searchTerm);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isLoadingMore, loadPage, page, searchTerm]);

  useEffect(() => {
    if (isLoading) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          void loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10">
          <h1 className="text-xl font-bold">Feed</h1>
        </header>

        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar posts..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
          />
        </div>

        <CreatePostForm onPostCreated={handlePostCreated} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-muted-foreground text-lg">
              {searchTerm.trim()
                ? "Nenhum post encontrado para essa busca."
                : "Seu feed está vazio. Siga alguém para ver publicações 🙂"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdate={handlePostUpdate}
              />
            ))}

            <div ref={loadMoreRef} className="py-8 min-h-[100px]">
              {isLoadingMore && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!hasMore && !isLoadingMore && (
                <p className="text-center text-muted-foreground text-sm">
                  {searchTerm.trim()
                    ? "Você chegou ao fim dos resultados ✨"
                    : "Você chegou ao fim do feed ✨"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Feed;