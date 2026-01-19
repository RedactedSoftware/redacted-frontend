// WebSocket URLs - Only WS_BASE is needed now
// API calls now go through Next.js rewrites (relative /api/:path*)
const WS_BASE_VALUE = process.env.NEXT_PUBLIC_WS_URL;

// In production, fail loudly if env vars are missing
if (!WS_BASE_VALUE) {
  throw new Error(
    "❌ CRITICAL: NEXT_PUBLIC_WS_URL is not set. " +
    "Check your .env.local or Vercel environment variables."
  );
}

// API_BASE is deprecated - use relative paths /api/* instead
// This is kept for backward compatibility during transition
export const API_BASE = "http://localhost:8082";
export const WS_BASE = WS_BASE_VALUE;
