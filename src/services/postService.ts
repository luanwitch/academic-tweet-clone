import { apiRequest } from "./api";
import type { Comment, Post } from "@/types";

/**
 * Paginated response padrão do Django REST Framework
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type GetPostsParams = {
  author?: number;
  page?: number;
};

function buildQuery(params: Record<string, any>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export const postService = {
  /**
   * Get feed (posts from followed users)
   */
  async getFeed(page: number = 1): Promise<PaginatedResponse<Post>> {
    return apiRequest<PaginatedResponse<Post>>(`/feed/?page=${page}`);
  },

  /**
   * Get all posts or posts from a specific user
   *
   * ✅ Aceita 2 assinaturas:
   * - getPosts(userId?: number, page?: number)
   * - getPosts({ author?: number, page?: number })
   */
  async getPosts(
    userIdOrParams?: number | GetPostsParams,
    page: number = 1
  ): Promise<PaginatedResponse<Post>> {
    // Modo novo: getPosts({ author, page })
    if (
      userIdOrParams &&
      typeof userIdOrParams === "object" &&
      !Array.isArray(userIdOrParams)
    ) {
      const author = userIdOrParams.author;
      const p = userIdOrParams.page ?? 1;

      const query = buildQuery({ author, page: p });
      return apiRequest<PaginatedResponse<Post>>(`/posts/${query}`);
    }

    // Modo antigo: getPosts(userId, page)
    const userId =
      typeof userIdOrParams === "number" ? userIdOrParams : undefined;

    const query = buildQuery({ author: userId, page });
    return apiRequest<PaginatedResponse<Post>>(`/posts/${query}`);
  },

  /**
   * Get single post
   */
  async getPost(postId: number): Promise<Post> {
    return apiRequest<Post>(`/posts/${postId}/`);
  },

  /**
   * Create new post
   */
  async createPost(content: string): Promise<Post> {
    return apiRequest<Post>("/posts/", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Like a post
   */
  async likePost(postId: number): Promise<void> {
    return apiRequest<void>(`/posts/${postId}/like/`, {
      method: "POST",
    });
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: number): Promise<void> {
    return apiRequest<void>(`/posts/${postId}/like/`, {
      method: "DELETE",
    });
  },

  /**
   * Get comments for a post
   */
  async getComments(postId: number): Promise<Comment[]> {
    return apiRequest<Comment[]>(`/posts/${postId}/comments/`);
  },

  /**
   * Add comment to a post
   */
  async addComment(postId: number, content: string): Promise<Comment> {
    return apiRequest<Comment>(`/posts/${postId}/comments/`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};