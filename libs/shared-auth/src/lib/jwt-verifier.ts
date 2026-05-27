import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const url =
      process.env['AUTH_JWKS_URL'] ?? 'http://localhost:3003/auth/jwks';
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

/**
 * Verify an RS256 access token against Better Auth's JWKS (cached). Issuer and
 * audience are enforced when the corresponding env vars are set.
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: process.env['AUTH_ISSUER'] || undefined,
    audience: process.env['AUTH_AUDIENCE'] || undefined,
  });
  return payload;
}

/** Extract a Bearer token from an Authorization header value. */
export function extractBearer(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}
