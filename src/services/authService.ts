interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface User {
  id: string;
  username: string;
}

const TOKEN_KEY = 'auth_token';

export async function login(username: string, password: string): Promise<LoginResponse | null> {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as LoginResponse;
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch {
    return null;
  }
}

export async function register(username: string, password: string): Promise<LoginResponse | null> {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as LoginResponse;
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
      }
      return null;
    }

    return (await response.json()) as User;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
