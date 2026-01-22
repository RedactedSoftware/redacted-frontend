import { API_BASE } from "../api/constants";
const LOGIN_URL = `${API_BASE}/api/login`;
const SIGNUP_URL = `${API_BASE}/api/signup`;
// src/api/auth.ts
type AuthResponse = {
  token: string;
};

// Safe JSON helper
async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON but got ${ct}. Body: ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON: ${text.slice(0, 100)}`);
  }
}

export async function signup(email: string, password: string): Promise<string> {
  try {
    console.log('📤 Signup attempt to:', SIGNUP_URL);
    const res = await fetch(SIGNUP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('📬 Signup response status:', res.status);
    const data = (await safeJson(res)) as AuthResponse;
    console.log('✅ Signup successful');
    
    // Save token to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
      console.log("💾 Token saved to localStorage (signup)");
    }
    
    return data.token;
  } catch (err: any) {
    console.error('❌ Signup exception:', err);
    throw err;
  }
}

export async function login(email: string, password: string): Promise<string> {
  try {
    console.log('📤 Login attempt to:', LOGIN_URL);
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log('📬 Login response status:', res.status);
    const data = (await safeJson(res)) as AuthResponse;
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