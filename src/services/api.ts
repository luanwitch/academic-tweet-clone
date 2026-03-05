// src/services/api.ts
// ==============================
// API Configuration
// ==============================

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_BASE_URL = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;


// ==============================
// Token Management
// ==============================
// Backend espera: Authorization: Token <token>
// Vamos padronizar a chave como "token" (igual você já estava usando no debug)
//    e manter compatibilidade com "auth_token" (pra não quebrar quem já tinha salvo).

export const TOKEN_KEYS = ["token", "auth_token"] as const;

export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token") || localStorage.getItem("token");
};

export const setAuthToken = (token: string | null) => {
  // limpa sempre as duas chaves pra evitar conflito
  for (const k of TOKEN_KEYS) localStorage.removeItem(k);

  if (token) {
    // salva na chave principal usada no app
    localStorage.setItem("auth_token", token);
    localStorage.clear()
  }
};

export const changePassword = async (old_password: string, new_password: string, new_password2: string) => {
  const data = await apiRequest<{ message: string; token: string }>("/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({ old_password, new_password, new_password2 }),
  });

  // ✅ atualiza token automaticamente
  setAuthToken(data.token);
  return data;
};

// ==============================
// Core Request Function
// ==============================

type ApiRequestOptions = RequestInit & {
  /**
   * auth=true (padrão): envia Authorization se houver token
   * auth=false: nunca envia Authorization (ex: login/register)
   */
  auth?: boolean;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const token = getAuthToken();

  // ✅ Se endpoint já for URL completa, não concatena com baseURL
  const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = isAbsoluteUrl ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = new Headers(options.headers);

  // ✅ Se NÃO for FormData, assume JSON (mas respeita se já veio Content-Type)
  if (!(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // ✅ Token (se existir e não foi desativado)
  const shouldSendAuth = options.auth !== false;
  if (shouldSendAuth && token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const method = options.method || "GET";

  console.log(`[API REQUEST] ${method} ${url}`, {
    auth: shouldSendAuth ? "ON" : "OFF",
    tokenPresent: Boolean(token),
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
  const contentType = response.headers.get("content-type") || "";
  let data: any;

  if (contentType.includes("application/json")) {
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
      data?.error ||
      (typeof data === "object"
        ? Object.values(data).flat().join(", ")
        : null) ||
      "Erro na requisição";

    throw new Error(errorMessage);
  }

  return data as T;
};

// ==============================
// TYPES
// ==============================

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
};

export type UploadAvatarResponse = {
  avatar: string; // url absoluta
};

// ==============================
// AUTH
// ==============================

export const login = async (username: string, password: string) => {
  // ✅ login não envia Authorization
  const data = await apiRequest<{ token: string; username?: string; user_id?: number }>(
    "/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
      auth: false,
    }
  );

  // ✅ salva token na chave "token"
  setAuthToken(data.token);
  return data;
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
// PROFILE & AVATAR
// ==============================

/**
 * ✅ teu backend retorna o perfil em /users/me/
 */
export const getProfile = async () => {
  return apiRequest<MeResponse>("/users/me/");
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await apiRequest<UploadAvatarResponse>("/profile/upload-avatar/", {
    method: "POST",
    body: formData,
  });

  // ✅ Cache-buster: força o browser a recarregar a imagem após upload
  return {
    ...res,
    avatar: res.avatar.includes("?")
      ? `${res.avatar}&v=${Date.now()}`
      : `${res.avatar}?v=${Date.now()}`,
  };
};