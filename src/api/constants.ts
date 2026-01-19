// ✅ PRIMARY: Use direct client-side API calls with NEXT_PUBLIC_API_URL
// Rewrites are unreliable with service workers + caching + auth
// Direct calls to your backend are boring and reliable.

const API_URL_VALUE = process.env.NEXT_PUBLIC_API_URL;
const WS_BASE_VALUE = process.env.NEXT_PUBLIC_WS_URL;

// In production, fail loudly if env vars are missing
if (!API_URL_VALUE) {
  throw new Error(
    "❌ CRITICAL: NEXT_PUBLIC_API_URL is not set. " +
    "Check your .env.local or Vercel environment variables (Production)."
  );
}

if (!WS_BASE_VALUE) {
  throw new Error(
    "❌ CRITICAL: NEXT_PUBLIC_WS_URL is not set. " +
    "Check your .env.local or Vercel environment variables."
  );
}

export const API_BASE = API_URL_VALUE;
export const WS_BASE = WS_BASE_VALUE;
