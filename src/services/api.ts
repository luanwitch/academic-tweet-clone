// src/services/api.ts
// ==============================
// API Configuration
// ==============================

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_BASE_URL = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;

// ==============================
// Token Management
// ==============================

const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

// ==============================
// Core Request Function
// ==============================

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  // ✅ Se endpoint já for URL completa, não concatena com baseURL
  const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = isAbsoluteUrl ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  // Headers
  const headers = new Headers(options.headers);

  // ✅ Se NÃO for FormData, assume JSON (mas respeita se já veio Content-Type)
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // Token (se existir)
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const method = options.method || "GET";

  console.log(`[API REQUEST] ${method} ${url}`, {
    body: options.body instanceof FormData ? "FormData (Image)" : options.body,
  });

  const response = await fetch(url, {
    ...options,
    method,
    headers,
  });

  // No Content
  if (response.status === 204) {
    return {} as T;
  }

  // Parse de resposta
  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      console.error("ERRO DO SERVIDOR (HTML/TEXT):", text);
      throw new Error(`Erro ${response.status} no servidor.`);
    }
    data = text;
  }

  // Erros de API
  if (!response.ok) {
    const errorMessage =
      data?.detail ||
      data?.message ||
      (typeof data === "object"
        ? Object.values(data).flat().join(", ")
        : null) ||
      "Erro na requisição";

    throw new Error(errorMessage);
  }

  return data as T;
};

// ==============================
// AUTH
// ==============================

export const login = async (username: string, password: string) => {
  return apiRequest<{ token: string }>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
};

// ==============================
// POSTS
// ==============================

export const getPosts = async () => {
  return apiRequest<any[]>("/posts/");
};

export const createPost = async (content: string) => {
  return apiRequest("/posts/", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
};

// ==============================
// PROFILE & AVATAR UPLOAD
// ==============================

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiRequest("/profile/upload-avatar/", {
    method: "POST",
    body: formData,
  });
};

export const getProfile = async () => {
  return apiRequest("/profile/");
};