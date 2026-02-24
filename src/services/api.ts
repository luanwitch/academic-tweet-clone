// API Configuration for Django REST Framework Backend
// CORREÇÃO: Removendo barra final da base para evitar duplicação
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Generic fetch wrapper with auth headers
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  // CORREÇÃO: Garante que o endpoint comece com uma única barra
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  // A concatenação agora é segura contra barras duplas
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const errorText = await response.text();
    console.error("Erro crítico do servidor (HTML recebido):", errorText);
    throw new Error(`Erro ${response.status}: O Backend não retornou JSON. Verifique a rota ${cleanEndpoint}.`);
  }

  if (!response.ok) {
    const errorMessage = 
      data.detail || 
      data.message || 
      (typeof data === 'object' ? Object.values(data).flat().join(', ') : null) || 
      'Erro na requisição';
    throw new Error(errorMessage);
  }

  return data as T;
};

export const apiUpload = async <T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'PATCH'
): Promise<T> => {
  const token = getAuthToken();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    method,
    headers, 
    body: formData,
  });

  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    throw new Error(`Erro no upload (${response.status}).`);
  }

  if (!response.ok) {
    const errorMessage = data.detail || data.message || 'Erro no upload de arquivo';
    throw new Error(errorMessage);
  }

  return data as T;
};

export { API_BASE_URL };