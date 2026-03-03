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

    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  },

  // ✅ Register new user (rota correta do backend)
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Se seu backend NÃO retorna token no register, isso aqui só não faz nada (ok)
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  },

  // ✅ Logout (DRF Token padrão não tem logout)
  async logout(): Promise<void> {
    // Só limpa localmente
    localStorage.removeItem('auth_token');
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>('/users/me/');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};