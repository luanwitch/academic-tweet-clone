// Authentication Service - Handles login, register, logout
import { apiRequest, setAuthToken, getAuthToken } from "./api";
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from "@/types";

export const authService = {
  // ==============================
  // Login user and get token
  // ==============================
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
      auth: false, // login não deve enviar Authorization
    });

    if (response.token) {
      setAuthToken(response.token); // usa função centralizada do api.ts
    }

    return response;
  },

  // ==============================
  // Register new user
  // ==============================
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/register/", {
      method: "POST",
      body: JSON.stringify(credentials),
      auth: false,
    });

    // se backend retornar token já salva
    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  // ==============================
  // Logout
  // ==============================
  async logout(): Promise<void> {
    // DRF Token Auth padrão não tem endpoint de logout
    setAuthToken(null);
  },

  // ==============================
  // Get current user profile
  // ==============================
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>("/users/me/");
  },

  // ==============================
  // Auth helpers
  // ==============================
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  getToken(): string | null {
    return getAuthToken();
  },
};