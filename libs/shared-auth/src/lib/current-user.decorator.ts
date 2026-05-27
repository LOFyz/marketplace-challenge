import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Principal } from './principal.js';

/** Injects the authenticated `Principal` attached by `JwtAuthGuard`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal | undefined => {
    const req = context.switchToHttp().getRequest<{ principal?: Principal }>();
    return req.principal;
  },
);
