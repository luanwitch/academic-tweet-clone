// Create Post Page - Dedicated page for creating new posts
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const MAX_CHARS = 280;

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await postService.createPost(content.trim());
      toast({
        title: 'Sucesso',
        description: 'Postagem publicada!',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível publicar',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border p-4 z-10 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Nova Postagem</h1>
        </header>

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.profile_picture} alt={user?.username} />
              <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Textarea
                placeholder="O que está acontecendo?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none border-0 focus-visible:ring-0 p-0 text-lg"
                autoFocus
              />

              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                {/* Character Counter */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                      charsLeft < 0
                        ? 'border-destructive text-destructive'
                        : charsLeft < 20
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {charsLeft < 20 ? charsLeft : ''}
                  </div>
                  <span
                    className={`text-sm ${
                      charsLeft < 0
                        ? 'text-destructive'
                        : charsLeft < 20
                        ? 'text-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {charsLeft} caracteres restantes
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isEmpty || isOverLimit || isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    'Publicar'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreatePost;
