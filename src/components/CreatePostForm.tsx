// CreatePostForm Component - Form to create a new post/tweet
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { postService } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Post } from '@/types';

interface CreatePostFormProps {
  onPostCreated?: (post: Post) => void;
}

const MAX_CHARS = 280;

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const post = await postService.createPost(content.trim());
      setContent('');
      onPostCreated?.(post);
      toast({
        title: 'Sucesso',
        description: 'Postagem publicada!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível publicar a postagem',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-border">
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
            className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0 text-lg"
          />

          <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
            {/* Character Counter */}
            <span
              className={`text-sm ${
                charsLeft < 20
                  ? charsLeft < 0
                    ? 'text-destructive'
                    : 'text-yellow-500'
                  : 'text-muted-foreground'
              }`}
            >
              {charsLeft}
            </span>

            <Button
              type="submit"
              disabled={isEmpty || isOverLimit || isSubmitting}
              className="px-6"
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
  );
};

export default CreatePostForm;
