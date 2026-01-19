// Environment-based API and WebSocket URLs
const API_BASE_VALUE = process.env.NEXT_PUBLIC_API_URL;
const WS_BASE_VALUE = process.env.NEXT_PUBLIC_WS_URL;

// In production, fail loudly if env vars are missing
if (!API_BASE_VALUE) {
  throw new Error(
    "❌ CRITICAL: NEXT_PUBLIC_API_URL is not set. " +
    "Check your .env.local or Vercel environment variables."
  );
}

if (!WS_BASE_VALUE) {
  throw new Error(
    "❌ CRITICAL: NEXT_PUBLIC_WS_URL is not set. " +
    "Check your .env.local or Vercel environment variables."
  );
}

export const API_BASE = API_BASE_VALUE;
export const WS_BASE = WS_BASE_VALUE;
