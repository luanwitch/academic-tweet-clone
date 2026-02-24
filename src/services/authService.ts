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
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      // O endpoint /auth/logout/ no Django deleta o Token no banco
      await apiRequest('/auth/logout/', {
        method: 'POST',
      });
    } catch (error) {
      console.warn("Aviso: Falha ao informar logout ao servidor, limpando localmente...");
    } finally {
      // Sempre remove o token do navegador, mesmo se a rede falhar
      localStorage.removeItem('auth_token');
    }
  },

  // Get current user profile (Dados que alimentam o AuthContext)
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>('/users/me/');
  },

  // Check if user is authenticated (Apenas verifica presença do Token)
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};