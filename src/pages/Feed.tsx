import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import CreatePostForm from "@/components/CreatePostForm";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/types";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

 // 1. Função de normalização estável
  const normalizeResponse = useCallback((data: any) => {
    console.log("Feed: Normalizando dados...", data);
    if (data && data.results && Array.isArray(data.results)) {
      return { normalizedPosts: data.results, hasNext: Boolean(data.next) };
    }
    if (Array.isArray(data)) {
      return { normalizedPosts: data, hasNext: false };
    }
    return { normalizedPosts: [], hasNext: false };
  }, []);

  // 2. useEffect simplificado para evitar loops
  useEffect(() => {
    let isMounted = true;

    const loadInitialPosts = async () => {
      // Força o início do loading
      setIsLoading(true);
      
      try {
        console.log("Feed: Iniciando busca de posts...");
        const response = await postService.getFeed(1);
        
        if (isMounted) {
          const { normalizedPosts, hasNext } = normalizeResponse(response);
          console.log("Feed: Sucesso! Posts carregados:", normalizedPosts.length);
          
          setPosts(normalizedPosts);
          setHasMore(hasNext);
          setPage(1);
        }
      } catch (error) {
        console.error("Feed: Erro na requisição:", error);
        if (isMounted) {
          toast({
            title: "Erro de conexão",
            description: "Não foi possível carregar os posts.",
            variant: "destructive",
          });
        }
      } finally {
        // CORREÇÃO CRÍTICA: O setIsLoading(false) DEVE rodar por último
        if (isMounted) {
          console.log("Feed: Encerrando estado de loading.");
          setIsLoading(false);
        }
      }
    };

    loadInitialPosts();

    return () => {
      isMounted = false;
    };
    // REMOVIDO: normalizeResponse e toast das dependências para evitar loop infinito
  }, []);
  // ➕ Criar novo post
  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // 🔄 Atualizar post (Like/Edit)
  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  // 📄 Carregar mais (Infinite Scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await postService.getFeed(nextPage);
      const { normalizedPosts, hasNext } = normalizeResponse(response);

      setPosts((prev) => [...prev, ...normalizedPosts]);
      setHasMore(hasNext);
      setPage(nextPage);
    } catch (error) {
      console.error("Erro ao carregar mais:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, normalizeResponse]);

  // 👀 Intersection Observer
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
            <p className="text-muted-foreground text-lg">Seu feed está vazio.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post, index) => (
              <PostCard
                key={`${post.id}-${index}`} // Key única
                post={post}
                onPostUpdate={handlePostUpdate}
              />
            ))}

            <div ref={loadMoreRef} className="py-8 min-h-[100px]">
              {isLoadingMore ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                !hasMore && (
                  <p className="text-center text-muted-foreground text-sm">
                    Você chegou ao fim do feed ✨
                  </p>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Feed;