// API Configuration for Django REST Framework Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Generic fetch wrapper with auth headers
 * CORREÇÃO: Adicionado tratamento para respostas não-JSON (HTML de erro do Django)
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 1. Lida com 204 No Content (ex: delete, like)
  if (response.status === 204) {
    return {} as T;
  }

  // 2. Valida se a resposta é JSON para evitar o erro "Unexpected token <"
  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    // Se o Django retornar HTML (erro 404 ou 500), capturamos como texto
    const errorText = await response.text();
    console.error("Erro crítico do servidor (HTML recebido):", errorText);
    throw new Error(`Erro no servidor (${response.status}). Verifique se a rota ${endpoint} existe no Backend.`);
  }

  // 3. Lida com erros de validação do Django (400, 401, 403, etc)
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
  method: 'POST' | 'PATCH' = 'PATCH' // Permite flexibilidade
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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