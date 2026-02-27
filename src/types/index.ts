// TypeScript interfaces for the Twitter Clone
// These match the expected Django REST Framework models

export interface User {
  profile_image: any;
  user_avatar: any;
  avatar: any;
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
  created_at: string;
}

export interface Post {
  user: any;
  user_id: any;
  username: any;
  id: number;
  author: User;
  content: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  author: User;
  post: number;
  content: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface ProfileUpdateData {
  username?: string;
  profile_picture?: File;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
