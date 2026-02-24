import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import CreatePostForm from '@/components/CreatePostForm';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 1. Carregamento inicial corrigido
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const response = await postService.getFeed(1);
        setPosts(response.results); // Substitui a lista para evitar duplicados
        setHasMore(!!response.next);
        setPage(1);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o feed',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, [toast]);

  // 2. Função de carregar mais
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await postService.getFeed(nextPage);
      setPosts((prev) => [...prev, ...response.results]);
      setHasMore(!!response.next);
      setPage(nextPage);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar mais posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, toast]);

  // 3. Observer com trava de segurança (impede carregar página 2 antes da 1 terminar)
  useEffect(() => {
    if (isLoading) return; // Trava essencial: não observa enquanto o feed inicial carrega

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMore]);

  const handlePostCreated = (newPost: Post) => setPosts((prev) => [newPost, ...prev]);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)));
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10">
          <h1 className="text-xl font-bold">Feed</h1>
        </header>

        <CreatePostForm onPostCreated={handlePostCreated} />

        {/* 4. Renderização unificada (Removida a duplicidade de código) */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (posts || []).length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground text-lg mb-2">Seu feed está vazio</p>
            <p className="text-muted-foreground text-sm">Siga outros usuários para ver postagens!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={`${post.id}-${post.created_at}`} post={post} onPostUpdate={handlePostUpdate} />
            ))}

            <div ref={loadMoreRef} className="py-4">
              {isLoadingMore && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-center text-muted-foreground text-sm">Você viu todas as postagens</p>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Feed;