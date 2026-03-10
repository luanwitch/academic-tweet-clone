import React, { useEffect, useState } from "react";
import { Loader2, Flame } from "lucide-react";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { postService } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";


type TrendingHashtag = {
  tag: string;
  count: number;
};

const Trending: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadTrending = async () => {
      try {
        setIsLoading(true);

        const [postsResponse, hashtagsResponse] = await Promise.all([
          postService.getTrendingPosts(),
          postService.getTrendingHashtags(),
        ]);

        setPosts(Array.isArray(postsResponse) ? postsResponse : []);
        setHashtags(Array.isArray(hashtagsResponse) ? hashtagsResponse : []);
      } catch {
        toast({
          title: "Erro ao carregar trending",
          description: "Não foi possível carregar os posts e hashtags em alta.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadTrending();
  }, [toast]);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handlePostDelete = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            <h1 className="text-xl font-bold">Trending</h1>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Trending Topics
              </h2>

              {hashtags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma hashtag em alta.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                {hashtags.map((item) => (
                        <Link
                          key={item.tag}
                          to={`/feed?hashtag=${item.tag}`}
                          className="rounded-full border border-border px-3 py-1 text-sm hover:bg-muted transition-colors"
                        >
                          #{item.tag} · {item.count}
                        </Link>
                      ))}
                </div>
              )}
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 px-4">
                <p className="text-muted-foreground text-lg">
                  Nenhum post em alta no momento.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post, index) => (
                  <div key={post.id}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 pt-3">
                      {index === 0 && "🔥 #1 Mais popular"}
                      {index === 1 && "🚀 #2 Em alta"}
                      {index === 2 && "⭐ #3 Viral"}
                    </div>

                    <PostCard
                      post={post}
                      currentUserId={user?.id}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Trending;