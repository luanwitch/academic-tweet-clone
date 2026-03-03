// User Service - Handles user profiles, follow/unfollow
import { apiRequest } from "./api";
import type { User, PaginatedResponse } from "@/types";

export const userService = {
  // Get user profile by ID
  async getUser(userId: number): Promise<User> {
    return apiRequest<User>(`/users/${userId}/`);
  },

  async updateProfile(data: any): Promise<any> {
  const file: File | undefined = data?.profile_picture || data?.avatar;

  if (!file) {
    return this.getMe();
  }

  await this.uploadAvatar(file);
  return this.getMe();
  },

  // ✅ Get current user (me)
  async getMe(): Promise<User> {
    return apiRequest<User>("/users/me/");
  },

  // ✅ Upload avatar (do computador) - endpoint real do backend
  async uploadAvatar(file: File): Promise<{ message: string; avatar_url?: string }> {
    const formData = new FormData();
    formData.append("avatar", file); // tem que ser 'avatar' igual no backend

    return apiRequest<{ message: string; avatar_url?: string }>("/profile/upload-avatar/", {
      method: "POST",
      body: formData,
    });
  },

  // Follow a user
  async followUser(userId: number): Promise<void> {
    return apiRequest<void>(`/users/${userId}/follow/`, { method: "POST" });
  },

  // Unfollow a user
  async unfollowUser(userId: number): Promise<void> {
    return apiRequest<void>(`/users/${userId}/follow/`, { method: "DELETE" });
  },

  // Get user's followers
  async getFollowers(userId: number): Promise<PaginatedResponse<User>> {
    // Se teu backend retorna lista simples, troque o tipo para User[]
    return apiRequest<PaginatedResponse<User>>(`/users/${userId}/followers/`);
  },

  // Get users that a user is following
  async getFollowing(userId: number): Promise<PaginatedResponse<User>> {
    // Se teu backend retorna lista simples, troque o tipo para User[]
    return apiRequest<PaginatedResponse<User>>(`/users/${userId}/following/`);
  },
};