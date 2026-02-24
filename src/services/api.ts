// Configuração da URL Base
// Remove barras extras caso existam no seu arquivo .env
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Wrapper genérico para fetch
 * CORREÇÃO: Limpeza automática de endpoints para evitar barras duplas
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  // Garante que o endpoint comece com apenas uma barra
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  // A montagem final agora é sempre segura
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return {} as T;

  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    // Captura o HTML de erro (404/500) do Django para exibir no console
    const errorText = await response.text();
    console.error("Servidor retornou HTML em vez de JSON:", errorText);
    throw new Error(`Erro ${response.status}: Rota não encontrada no Backend.`);
  }

  if (!response.ok) {
    const errorMessage = data.detail || data.message || 'Erro na requisição';
    throw new Error(errorMessage);
  }

  return data as T;
};

export { API_BASE_URL };