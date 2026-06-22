const BASE_URL = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8080/api/v1';

// Função auxiliar para injetar o token e gerenciar 401
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('adminToken');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Se body for JSON e content-type não estiver setado, setamos automaticamente
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // Se o endpoint for de login, não desloga, apenas retorna o 401 para a tela tratar
    if (!endpoint.includes('/admin/login')) {
      localStorage.removeItem('adminToken');
      window.location.href = '/gestor-nlf-admin'; // Hard redirect limpa estado e forca login
    }
  }

  return response;
};

// Helpers para requests comuns
export const api = {
  get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
  
  post: (endpoint: string, body: any) => 
    apiFetch(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      // Headers são tratados no apiFetch: FormData NÃO deve ter Content-Type setado manualmente
      headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' }
    }),
    
  put: (endpoint: string, body: any) => 
    apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }),
    
  delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' })
};
