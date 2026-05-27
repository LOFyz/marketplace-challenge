import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { extractBearer, verifyAccessToken } from './jwt-verifier.js';
import { principalFromPayload, type Principal } from './principal.js';

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  principal?: Principal;
}

/**
 * Validates the incoming Bearer JWT (escopo §4.1/§7) against Better Auth's JWKS
 * and attaches the resolved `Principal` to the request. HTTP-level guard — used at
 * the gateway, which is the auth boundary; subgraphs trust forwarded headers.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestLike>();
    const header = req.headers['authorization'];
    const token = extractBearer(Array.isArray(header) ? header[0] : header);
    if (!token) throw new UnauthorizedException('Missing bearer token');
    try {
      const payload = await verifyAccessToken(token);
      req.principal = principalFromPayload(payload);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

/** Assert a principal carries a required scope (escopo §7.3 / §8). */
export function assertScope(principal: Principal, required: string): void {
  if (!principal.scope.includes(required)) {
    throw new UnauthorizedException(`Missing required scope: ${required}`);
  }
}
