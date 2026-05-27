import type { JWTPayload } from 'jose';

/** Authenticated principal derived from a validated access token. */
export interface Principal {
  userId: string;
  supplierId?: string;
  roles: string[];
  scope: string[];
}

/** Maps a verified JWT payload (escopo §7.2 claims) to a `Principal`. */
export function principalFromPayload(payload: JWTPayload): Principal {
  const scopeClaim = payload['scope'];
  const scope =
    typeof scopeClaim === 'string'
      ? scopeClaim.split(' ').filter(Boolean)
      : Array.isArray(scopeClaim)
        ? (scopeClaim as string[])
        : [];
  const rolesClaim = payload['roles'];
  const roles = Array.isArray(rolesClaim) ? (rolesClaim as string[]) : [];
  return {
    userId: String(payload.sub ?? ''),
    supplierId: payload['supplier_id'] ? String(payload['supplier_id']) : undefined,
    roles,
    scope,
  };
}
