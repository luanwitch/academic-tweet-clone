// Post Service - Handles posts, likes, comments
import { apiRequest } from './api';
import type { Post, Comment, PaginatedResponse } from '@/types';

export const postService = {
  // Get feed (posts from followed users)
  async getFeed(page: number = 1): Promise<PaginatedResponse<Post>> {
    return apiRequest<PaginatedResponse<Post>>(`/feed/?page=${page}`);
  },

  // Get all posts (or user's posts)
  async getPosts(userId?: number, page: number = 1): Promise<PaginatedResponse<Post>> {
    const endpoint = userId 
      ? `/posts/?author=${userId}&page=${page}`
      : `/posts/?page=${page}`;
    return apiRequest<PaginatedResponse<Post>>(endpoint);
  },

  // Get single post
  async getPost(postId: number): Promise<Post> {
    return apiRequest<Post>(`/posts/${postId}/`);
  },

  // Create new post
  async createPost(content: string): Promise<Post> {
    return apiRequest<Post>('/posts/', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Like a post
  async likePost(postId: number): Promise<void> {
    return apiRequest(`/posts/${postId}/like/`, {
      method: 'POST',
    });
  },

  // Unlike a post
  async unlikePost(postId: number): Promise<void> {
    return apiRequest(`/posts/${postId}/like/`, {
      method: 'DELETE',
    });
  },

  // Get comments for a post
  async getComments(postId: number): Promise<Comment[]> {
    return apiRequest<Comment[]>(`/posts/${postId}/comments/`);
  },

  // Add comment to a post
  async addComment(postId: number, content: string): Promise<Comment> {
    return apiRequest<Comment>(`/posts/${postId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};
