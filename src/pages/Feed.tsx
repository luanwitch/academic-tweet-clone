import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import CreatePostForm from "@/components/CreatePostForm";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/types";
import { useAuth } from "@/context/AuthContext";


const PAGE_SIZE = 10;

const PostSkeleton = () => {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-muted" />

        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>

          <div className="flex gap-6 pt-2">
            <div className="h-4 w-12 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1">
            <h2 className="font-semibold text-destructive">
              Erro ao carregar posts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>

            <button
              onClick={onRetry}
              className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const hashtagParam = searchParams.get("hashtag") || "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState(
    hashtagParam ? `#${hashtagParam}` : ""
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const didMountSearchRef = useRef(false);

  useEffect(() => {
    if (hashtagParam) {
      setSearchTerm(`#${hashtagParam}`);
    }
  }, [hashtagParam]);

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
    async (pageToLoad: number, mode: "replace" | "append") => {
      try {
        let normalizedPosts: Post[] = [];
        let nextPageExists = false;

        const trimmedSearch = searchTerm.trim();

        if (trimmedSearch.startsWith("#")) {
          const hashtag = trimmedSearch.replace(/^#/, "");
          const response = await postService.getPostsByHashtag(
            hashtag,
            pageToLoad
          );

          const normalized = normalizeResponse(response);
          normalizedPosts = normalized.normalizedPosts;
          nextPageExists = normalized.hasNext;
        } else if (trimmedSearch) {
          const response = await postService.searchPosts(
            trimmedSearch,
            pageToLoad
          );

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
          mode === "replace"
            ? normalizedPosts
            : [...prev, ...normalizedPosts]
        );

        setError(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os posts.";

        if (mode === "replace") {
          setPosts([]);
          setError(message);
        } else {
          toast({
            title: "Erro ao carregar mais posts",
            description: message,
            variant: "destructive",
          });
        }
      }
    },
    [normalizeResponse, searchTerm, toast]
  );

  const fetchInitialFeed = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setHasMore(false);
      setPage(1);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadPage(1, "replace");
    } finally {
      setIsLoading(false);
    }
  }, [user, loadPage]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await fetchInitialFeed();
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [fetchInitialFeed]);

  useEffect(() => {
    if (!user) return;

    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        await loadPage(1, "replace");
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchTerm, user, loadPage]);

  const handlePostCreated = (newPost: Post) => {
    const trimmedSearch = searchTerm.trim().toLowerCase();

    if (trimmedSearch) {
      const matchesSearch = newPost.content
        ?.toLowerCase()
        .includes(trimmedSearch.replace(/^#/, ""));

      if (!matchesSearch) return;
    }

    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handlePostDelete = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      await loadPage(page + 1, "append");
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isLoadingMore, loadPage, page]);

  useEffect(() => {
    if (isLoading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

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

  const showInitialSkeleton = isLoading;
  const showEmptyState = !isLoading && !error && posts.length === 0;
  const showPosts = !isLoading && !error && posts.length > 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto min-h-screen border-x border-border">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 p-4 backdrop-blur-sm">
          <h1 className="text-xl font-bold">
            {hashtagParam ? `Resultados para #${hashtagParam}` : "Feed"}
          </h1>
        </header>

        <div className="border-b border-border p-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              hashtagParam
                ? `Filtrando por #${hashtagParam}`
                : "Buscar posts..."
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <CreatePostForm onPostCreated={handlePostCreated} />

        {showInitialSkeleton && (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <FeedErrorState
            message={error}
            onRetry={() => {
              void fetchInitialFeed();
            }}
          />
        )}

        {showEmptyState && (
          <div className="px-4 py-20 text-center">
            <p className="text-lg text-muted-foreground">
              {hashtagParam
                ? `Nenhum post encontrado para #${hashtagParam}.`
                : searchTerm.trim()
                  ? "Nenhum post encontrado para essa busca."
                  : "Seu feed está vazio. Siga alguém para ver publicações 🙂"}
            </p>
          </div>
        )}

        {showPosts && (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            ))}

            <div ref={loadMoreRef} className="min-h-[100px] py-8">
              {isLoadingMore && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {!hasMore && !isLoadingMore && (
                <p className="text-center text-sm text-muted-foreground">
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