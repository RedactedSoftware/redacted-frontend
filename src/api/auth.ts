// src/api/auth.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

type AuthResponse = {
  token: string;
};

export async function signup(email: string, password: string): Promise<string> {
  try {
    console.log('📤 Signup attempt to:', `${API_BASE}/api/signup`);
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('📬 Signup response status:', res.status);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('❌ Signup error response:', data);
      throw new Error(data.error || `Signup failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as AuthResponse;
    console.log('✅ Signup successful');
    return data.token;
  } catch (err: any) {
    console.error('❌ Signup exception:', err);
    throw err;
  }
}

export async function login(email: string, password: string): Promise<string> {
  try {
    console.log('📤 Login attempt to:', `${API_BASE}/api/login`);
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('📬 Login response status:', res.status);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('❌ Login error response:', data);
      throw new Error(data.error || `Login failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as AuthResponse;
    console.log('✅ Login successful');
    
    // Save token to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      console.log('💾 Token saved to localStorage');
    }
    
    return data.token;
  } catch (err: any) {
    console.error('❌ Login exception:', err);
    throw err;
  }
}