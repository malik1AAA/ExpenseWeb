const normalizeOrigin = (value: string) => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

const allowedOrigins = new Set([
  Deno.env.get('APP_URL') ?? '',
  ...(Deno.env.get('CORS_ALLOWED_ORIGINS') ?? '').split(','),
  'http://localhost:3000',
  'http://localhost:5173',
].map(normalizeOrigin).filter((origin): origin is string => origin !== null));

export const corsHeadersForRequest = (request: Request) => {
  const origin = request.headers.get('Origin');
  return {
    ...(origin && allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

export const jsonResponse = (body: unknown, status = 200, request?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...(request ? corsHeadersForRequest(request) : {}), 'Content-Type': 'application/json' },
  });

export const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};
