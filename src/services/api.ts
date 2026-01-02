// API Configuration for Django REST Framework Backend
// Change VITE_API_URL in your .env file to point to your Django server

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Generic fetch wrapper with auth headers
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    // Extract error message from DRF response
    const errorMessage = data.detail || data.message || 
      Object.values(data).flat().join(', ') || 
      'Erro na requisição';
    throw new Error(errorMessage);
  }

  return data as T;
};

// File upload wrapper (for profile pictures)
export const apiUpload = async <T>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.detail || data.message || 'Erro no upload';
    throw new Error(errorMessage);
  }

  return data as T;
};

export { API_BASE_URL };
