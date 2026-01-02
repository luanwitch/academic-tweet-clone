// Authentication Service - Handles login, register, logout
import { apiRequest } from './api';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types';

export const authService = {
  // Login user and get token
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token in localStorage
    localStorage.setItem('auth_token', response.token);
    
    return response;
  },

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token in localStorage
    localStorage.setItem('auth_token', response.token);
    
    return response;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout/', {
        method: 'POST',
      });
    } finally {
      // Always clear token, even if request fails
      localStorage.removeItem('auth_token');
    }
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>('/users/me/');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};
