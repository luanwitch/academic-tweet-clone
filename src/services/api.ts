// ==============================
// API Configuration
// ==============================

// Remove barra final da URL base (evita // no endpoint)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const API_BASE_URL = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

// Debug (remover em produção se quiser)
console.log("BASE:", BASE);
console.log("API FINAL:", API_BASE_URL);

// ==============================
// Token
// ==============================

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// ==============================
// Core Request Function
// ==============================

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  // Garante formato correto da URL
  const cleanEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  // Headers padrão
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Token
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  // 🔥 GARANTE QUE SEMPRE TEM MÉTODO
  const method = options.method || 'GET';

  // Debug forte (ESSENCIAL PRA VOCÊ AGORA)
  console.log("REQUEST:", {
    url,
    method,
    body: options.body,
  });

  const response = await fetch(url, {
    ...options,
    method,
    headers,
  });

  // 204 (sem conteúdo)
  if (response.status === 204) {
    return {} as T;
  }

  // Verifica se é JSON
  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    console.error("HTML RECEBIDO:", text);
    throw new Error(`Erro ${response.status}: resposta não é JSON`);
  }

  // Erros do backend
  if (!response.ok) {
    const errorMessage =
      data.detail ||
      data.message ||
      (typeof data === 'object'
        ? Object.values(data).flat().join(', ')
        : null) ||
      'Erro na requisição';

    throw new Error(errorMessage);
  }

  return data as T;
};

// ==============================
// AUTH (LOGIN)
// ==============================

export const login = async (username: string, password: string) => {
  return apiRequest('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
    }),
  });
};

// ==============================
// POSTS (EXEMPLOS)
// ==============================

export const getPosts = async () => {
  return apiRequest('/posts/');
};

export const createPost = async (content: string) => {
  return apiRequest('/posts/', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

export const likePost = async (postId: number) => {
  return apiRequest(`/posts/${postId}/like/`, {
    method: 'POST',
  });
};