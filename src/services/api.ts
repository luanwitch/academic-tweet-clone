// src/services/api.ts

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_BASE_URL = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;

export const TOKEN_KEYS = ["token", "auth_token"] as const;

export const getAuthToken = (): string | null => {
  return localStorage.getItem("token") || localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string | null) => {
  for (const key of TOKEN_KEYS) {
    localStorage.removeItem(key);
  }

  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("auth_token", token);
  }
};

export const clearAuthToken = () => {
  for (const key of TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem("user");
};

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  tokenOverride?: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Post = {
  id: number;
  user: number;
  user_id: number;
  username: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  is_owner?: boolean;
  image?: string | null;
};

export type Comment = {
  id: number;
  tweet: number;
  user: number;
  username: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
  is_owner?: boolean;
};

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
  bio?: string;
  is_following?: boolean;
};

export type UploadAvatarResponse = {
  avatar: string;
};

export const extractResults = <T>(data: T[] | PaginatedResponse<T> | unknown): T[] => {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as PaginatedResponse<T>).results)
  ) {
    return (data as PaginatedResponse<T>).results;
  }
  return [];
};

const extractErrorMessage = (data: unknown, status: number): string => {
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const errorData = data as Record<string, unknown>;

    if (typeof errorData.detail === "string" && errorData.detail.trim()) {
      return errorData.detail;
    }

    if (typeof errorData.message === "string" && errorData.message.trim()) {
      return errorData.message;
    }

    if (typeof errorData.error === "string" && errorData.error.trim()) {
      return errorData.error;
    }

    const values = Object.values(errorData)
      .flatMap((value) => {
        if (Array.isArray(value)) return value;
        return [value];
      })
      .filter((value) => typeof value === "string" && value.trim()) as string[];

    if (values.length > 0) {
      return values.join(", ");
    }
  }

  switch (status) {
    case 400:
      return "Dados inválidos. Verifique os campos e tente novamente.";
    case 401:
      return "Sua sessão expirou. Faça login novamente.";
    case 403:
      return "Você não tem permissão para realizar esta ação.";
    case 404:
      return "Recurso não encontrado.";
    case 500:
      return "Erro interno do servidor. Tente novamente mais tarde.";
    default:
      return "Erro na requisição.";
  }
};

export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const storedToken = getAuthToken();
  const token = options.tokenOverride || storedToken;

  const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = isAbsoluteUrl ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const shouldSendAuth = options.auth !== false;

  if (shouldSendAuth && token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const method = options.method || "GET";

  console.log(`[API REQUEST] ${method} ${url}`, {
    auth: shouldSendAuth ? "ON" : "OFF",
    tokenPresent: Boolean(token),
    body: isFormData ? "FormData" : options.body,
  });

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type") || "";
    let data: unknown = null;

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = await response.text();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message = extractErrorMessage(data, response.status);

      if (response.status === 401) {
        clearAuthToken();
      }

      console.error(`[API ERROR] ${method} ${url}`, {
        status: response.status,
        message,
        response: data,
      });

      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TypeError") {
        throw new Error("Erro de conexão. Verifique sua internet ou o servidor.");
      }

      throw error;
    }

    throw new Error("Ocorreu um erro inesperado.");
  }
};

export const login = async (username: string, password: string) => {
  const data = await apiRequest<{ token: string; username?: string; user_id?: number }>(
    "/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
      auth: false,
    }
  );

  setAuthToken(data.token);

  const me = await apiRequest<MeResponse>("/users/me/", {
    method: "GET",
    auth: true,
    tokenOverride: data.token,
  });

  localStorage.setItem("user", JSON.stringify(me));

  return {
    ...data,
    me,
  };
};

export const logout = () => {
  clearAuthToken();
};

export const getProfile = async () => {
  return apiRequest<MeResponse>("/users/me/", { auth: true });
};

export const updateProfile = async (payload: {
  username?: string;
  email?: string;
  bio?: string;
}) => {
  const data = await apiRequest<MeResponse>("/users/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
    auth: true,
  });

  localStorage.setItem("user", JSON.stringify(data));
  return data;
};

export const changePassword = async (
  old_password: string,
  new_password: string,
  new_password2: string
) => {
  const data = await apiRequest<{ message: string; token: string }>(
    "/auth/change-password/",
    {
      method: "POST",
      body: JSON.stringify({ old_password, new_password, new_password2 }),
      auth: true,
    }
  );

  setAuthToken(data.token);
  return data;
};

export const getPosts = async (page = 1) => {
  return apiRequest<Post[] | PaginatedResponse<Post>>(`/posts/?page=${page}`, {
    auth: true,
  });
};

export const getPostsList = async (page = 1): Promise<Post[]> => {
  const data = await getPosts(page);
  return extractResults<Post>(data);
};

export const getPostsByAuthor = async (authorId: number, page = 1) => {
  return apiRequest<Post[] | PaginatedResponse<Post>>(
    `/posts/?author=${authorId}&page=${page}`,
    { auth: true }
  );
};

export const getPostsByAuthorList = async (
  authorId: number,
  page = 1
): Promise<Post[]> => {
  const data = await getPostsByAuthor(authorId, page);
  return extractResults<Post>(data);
};

export const searchPosts = async (search: string, page = 1) => {
  return apiRequest<Post[] | PaginatedResponse<Post>>(
    `/posts/?search=${encodeURIComponent(search)}&page=${page}`,
    { auth: true }
  );
};

export const getFeed = async (page = 1, pageSize = 10) => {
  return apiRequest<PaginatedResponse<Post>>(
    `/feed/?page=${page}&page_size=${pageSize}`,
    { auth: true }
  );
};

export const getFeedList = async (page = 1, pageSize = 10): Promise<Post[]> => {
  const data = await getFeed(page, pageSize);
  return extractResults<Post>(data);
};

export const getTrendingPosts = async () => {
  return apiRequest<Post[]>("/posts/trending/", { auth: true });
};

export const createPost = async (content: string) => {
  return apiRequest<Post>("/posts/", {
    method: "POST",
    body: JSON.stringify({ content }),
    auth: true,
  });
};

export const likePost = async (postId: number) => {
  return apiRequest<{ liked: boolean; likes_count: number }>(`/posts/${postId}/like/`, {
    method: "POST",
    auth: true,
  });
};

export const getPostComments = async (postId: number) => {
  return apiRequest<Comment[]>(`/posts/${postId}/comments/`, {
    auth: true,
  });
};

export const createComment = async (postId: number, content: string) => {
  return apiRequest<Comment>(`/posts/${postId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ content }),
    auth: true,
  });
};

export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await apiRequest<UploadAvatarResponse>("/profile/upload-avatar/", {
    method: "POST",
    body: formData,
    auth: true,
  });

  return {
    ...res,
    avatar: res.avatar.includes("?")
      ? `${res.avatar}&v=${Date.now()}`
      : `${res.avatar}?v=${Date.now()}`,
  };
};