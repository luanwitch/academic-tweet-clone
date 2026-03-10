import { apiRequest, extractResults } from "./api";
import type { Comment, Post } from "@/types";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type GetPostsParams = {
  author?: number;
  page?: number;
  search?: string;
  hashtag?: string;
};

type PostsResponse<T> = T[] | PaginatedResponse<T>;

function buildQuery(params: Record<string, unknown>) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });

  const query = qs.toString();
  return query ? `?${query}` : "";
}

export const postService = {
  async getFeed(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Post>> {
    return apiRequest<PaginatedResponse<Post>>(
      `/feed/?page=${page}&page_size=${pageSize}`,
      {
        auth: true,
      }
    );
  },

  async getFeedList(page: number = 1, pageSize: number = 10): Promise<Post[]> {
    const data = await this.getFeed(page, pageSize);
    return extractResults<Post>(data);
  },

  async getPosts(
    userIdOrParams?: number | GetPostsParams,
    page: number = 1
  ): Promise<PostsResponse<Post>> {
    if (
      userIdOrParams &&
      typeof userIdOrParams === "object" &&
      !Array.isArray(userIdOrParams)
    ) {
      const author = userIdOrParams.author;
      const currentPage = userIdOrParams.page ?? 1;
      const search = userIdOrParams.search;
      const hashtag = userIdOrParams.hashtag;

      const query = buildQuery({
        author,
        page: currentPage,
        search,
        hashtag,
      });

      return apiRequest<PostsResponse<Post>>(`/posts/${query}`, {
        auth: true,
      });
    }

    const userId =
      typeof userIdOrParams === "number" ? userIdOrParams : undefined;

    const query = buildQuery({
      author: userId,
      page,
    });

    return apiRequest<PostsResponse<Post>>(`/posts/${query}`, {
      auth: true,
    });
  },

  async getPostsList(
    userIdOrParams?: number | GetPostsParams,
    page: number = 1
  ): Promise<Post[]> {
    const data = await this.getPosts(userIdOrParams, page);
    return extractResults<Post>(data);
  },

  async getPostsByAuthor(
    authorId: number,
    page: number = 1
  ): Promise<PostsResponse<Post>> {
    return this.getPosts({ author: authorId, page });
  },

  async getPostsByAuthorList(
    authorId: number,
    page: number = 1
  ): Promise<Post[]> {
    const data = await this.getPostsByAuthor(authorId, page);
    return extractResults<Post>(data);
  },

  async searchPosts(
    search: string,
    page: number = 1
  ): Promise<PostsResponse<Post>> {
    return this.getPosts({ search, page });
  },

  async searchPostsList(search: string, page: number = 1): Promise<Post[]> {
    const data = await this.searchPosts(search, page);
    return extractResults<Post>(data);
  },

  async getPostsByHashtag(
    hashtag: string,
    page: number = 1
  ): Promise<PostsResponse<Post>> {
    return this.getPosts({ hashtag, page });
  },

  async getPostsByHashtagList(
    hashtag: string,
    page: number = 1
  ): Promise<Post[]> {
    const data = await this.getPostsByHashtag(hashtag, page);
    return extractResults<Post>(data);
  },

  async getTrendingPosts(): Promise<Post[]> {
    return apiRequest<Post[]>("/posts/trending/", {
      auth: true,
    });
  },

  async getPost(postId: number): Promise<Post> {
    return apiRequest<Post>(`/posts/${postId}/`, {
      auth: true,
    });
  },

  async createPost(content: string): Promise<Post> {
    return apiRequest<Post>("/posts/", {
      method: "POST",
      body: JSON.stringify({ content }),
      auth: true,
    });
  },

  async likePost(
    postId: number
  ): Promise<{ liked: boolean; likes_count: number }> {
    return apiRequest<{ liked: boolean; likes_count: number }>(
      `/posts/${postId}/like/`,
      {
        method: "POST",
        auth: true,
      }
    );
  },

  async unlikePost(
    postId: number
  ): Promise<{ liked: boolean; likes_count: number }> {
    return apiRequest<{ liked: boolean; likes_count: number }>(
      `/posts/${postId}/like/`,
      {
        method: "POST",
        auth: true,
      }
    );
  },

  async getPostLikes(postId: number): Promise<any[]> {
    return apiRequest<any[]>(`/posts/${postId}/likes/`, {
      auth: true,
    });
  },

  async updatePost(postId: number, content: string) {
  return apiRequest<Post>(`/posts/${postId}/`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ content }),
  });
},

async deletePost(postId: number): Promise<void> {
  await apiRequest(`/posts/${postId}/`, {
    method: "DELETE",
    auth: true,
  });
},

  async getComments(postId: number): Promise<Comment[]> {
    return apiRequest<Comment[]>(`/posts/${postId}/comments/`, {
      auth: true,
    });
  },

  async addComment(postId: number, content: string): Promise<Comment> {
    return apiRequest<Comment>(`/posts/${postId}/comments/`, {
      method: "POST",
      body: JSON.stringify({ content }),
      auth: true,
    });
  },

  async deleteComment(commentId: number): Promise<void> {
    await apiRequest(`/comments/${commentId}/delete/`, {
      method: "DELETE",
      auth: true,
    });
  },
};