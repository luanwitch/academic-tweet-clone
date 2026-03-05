import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const { user } = useAuth();
  const { toast } = useToast();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const normalizeResponse = useCallback((data: any) => {
    if (Array.isArray(data)) {
      return { normalizedPosts: data, hasNext: false };
    }

    if (data && Array.isArray(data.results)) {
      return {
        normalizedPosts: data.results,
        hasNext: Boolean(data.next),
      };
    }

    return { normalizedPosts: [], hasNext: false };
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, mode: "replace" | "append") => {
      try {
        const response = await postService.getFeed(pageToLoad, PAGE_SIZE);
        const { normalizedPosts, hasNext } = normalizeResponse(response);

        setHasMore(hasNext);
        setPage(pageToLoad);

        setPosts((prev) =>
          mode === "replace" ? normalizedPosts : [...prev, ...normalizedPosts]
        );
      } catch (error) {
        toast({
          title: "Erro ao carregar feed",
          description: "Não foi possível carregar os posts.",
          variant: "destructive",
        });
      }
    },
    [normalizeResponse, toast]
  );

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    (async () => {
      setIsLoading(true);
      try {
        const response = await postService.getFeed(1, PAGE_SIZE);
        if (!isMounted) return;

        const { normalizedPosts, hasNext } = normalizeResponse(response);
        setPosts(normalizedPosts);
        setHasMore(hasNext);
        setPage(1);
      } catch (e) {
        if (!isMounted) return;
        toast({
          title: "Erro ao carregar feed",
          description: "Não foi possível carregar os posts.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user, normalizeResponse, toast]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      await loadPage(page + 1, "append");
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, loadPage]);

  useEffect(() => {
    if (isLoading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isLoading]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10">
          <h1 className="text-xl font-bold">Feed</h1>
        </header>

        <CreatePostForm onPostCreated={handlePostCreated} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-muted-foreground text-lg">
              Seu feed está vazio. Siga alguém para ver publicações 🙂
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
                  Você chegou ao fim do feed ✨
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