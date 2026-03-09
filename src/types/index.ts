export interface User {
  id: number;
  username: string;
  email?: string;

  avatar?: string | null;
  bio?: string | null;

  followers_count?: number;
  following_count?: number;

  is_following?: boolean;

  profile_image?: string | null;
  user_avatar?: string | null;
  profile_picture?: string | null;
}

export interface Post {
  id: number;
  user: number;
  user_id: number;
  username: string;
  user_avatar?: string | null;

  content: string;
  created_at: string;

  likes_count: number;
  comments_count: number;

  liked_by_me?: boolean;
  is_owner?: boolean;
}

export interface Comment {
  id: number;
  tweet?: number;
  post?: number;
  user?: number;
  username?: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
  is_owner?: boolean;
}

export interface AuthResponse {
  token: string;
  user?: User;
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
  email?: string;
  bio?: string;
  avatar?: File;
  profile_picture?: File;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}