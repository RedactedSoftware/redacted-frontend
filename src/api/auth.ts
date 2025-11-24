// src/api/auth.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type AuthResponse = {
  token: string;
};

export async function signup(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Signup failed');
  }

  const data = (await res.json()) as AuthResponse;
  return data.token;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }

  const data = (await res.json()) as AuthResponse;
  return data.token;
}
