// API Configuration for Django REST Framework Backend
// CORREÇÃO: Removemos barras extras da URL base vinda do .env
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Generic fetch wrapper with auth headers
 * CORREÇÃO: Sanitização automática do endpoint
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  // CORREÇÃO: Garante que o endpoint comece com apenas uma barra
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  // A montagem agora ignora se você colocou 'login' indevidamente no meio
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  // Lida com 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    // Captura o erro HTML do Django para não quebrar o parser JSON
    const errorText = await response.text();
    console.error("Erro crítico do servidor (HTML recebido):", errorText);
    throw new Error(`Erro 404: O Backend não retornou JSON. Verifique a rota ${cleanEndpoint}.`);
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

export { API_BASE_URL };