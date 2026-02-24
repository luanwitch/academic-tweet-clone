// API Configuration for Django REST Framework Backend
// CORREÇÃO: Removemos barras extras da URL base vinda do .env para evitar duplicação
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Generic fetch wrapper with auth headers
 * CORREÇÃO: Sanitização automática para evitar erros de caminhos repetidos ou barras duplas
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

  // A montagem final agora é protegida contra erros de digitação no .env ou no serviço
  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  // Lida com 204 No Content (ex: delete, like)
  if (response.status === 204) {
    return {} as T;
  }

  // Valida se a resposta é JSON para evitar o erro "Unexpected token <"
  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    // Se o Django retornar HTML (erro 404 ou 500), capturamos como texto para depuração
    const errorText = await response.text();
    console.error("Erro crítico do servidor (HTML recebido):", errorText);
    throw new Error(`Erro ${response.status}: O servidor não retornou JSON. Verifique se a rota ${cleanEndpoint} existe.`);
  }

  // Lida com erros de validação do Django
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