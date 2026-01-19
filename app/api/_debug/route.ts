export async function GET() {
  return Response.json({
    ok: true,
    apiOrigin: process.env.API_ORIGIN ?? null,
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
    nextPublicWsUrl: process.env.NEXT_PUBLIC_WS_URL ?? null,
    time: new Date().toISOString(),
    message: "✅ Debug endpoint working. Check values above.",
  });
}
