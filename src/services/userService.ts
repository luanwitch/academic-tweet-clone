// User Service - Handles user profiles, follow/unfollow
import { apiRequest } from './api';
import type { User, ProfileUpdateData, PasswordChangeData, PaginatedResponse } from '@/types';

export const userService = {
  // Get user profile by ID
  async getUser(userId: number): Promise<User> {
    return apiRequest<User>(`/users/${userId}/`);
  },

  // Update current user profile
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    // If there's a file, use FormData
    if (data.profile_picture) {
      const formData = new FormData();
      if (data.username) formData.append('username', data.username);
      formData.append('profile_picture', data.profile_picture);
      return apiUpload<User>('/users/me/', formData);
    }

    return apiRequest<User>('/users/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Change password
  async changePassword(data: PasswordChangeData): Promise<void> {
    return apiRequest('/users/me/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Follow a user
  async followUser(userId: number): Promise<void> {
    return apiRequest(`/users/${userId}/follow/`, {
      method: 'POST',
    });
  },

  // Unfollow a user
  async unfollowUser(userId: number): Promise<void> {
    return apiRequest(`/users/${userId}/follow/`, {
      method: 'DELETE',
    });
  },

  // Get user's followers
  async getFollowers(userId: number): Promise<PaginatedResponse<User>> {
    return apiRequest<PaginatedResponse<User>>(`/users/${userId}/followers/`);
  },

  // Get users that a user is following
  async getFollowing(userId: number): Promise<PaginatedResponse<User>> {
    return apiRequest<PaginatedResponse<User>>(`/users/${userId}/following/`);
  },

  // Search users
  async searchUsers(query: string): Promise<User[]> {
    return apiRequest<User[]>(`/users/search/?q=${encodeURIComponent(query)}`);
  },
};
function apiUpload<T>(arg0: string, formData: FormData): User | PromiseLike<User> {
  throw new Error('Function not implemented.');
}

