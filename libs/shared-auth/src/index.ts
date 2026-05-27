export { JwtAuthGuard, assertScope } from './lib/jwt-auth.guard.js';
export { CurrentUser } from './lib/current-user.decorator.js';
export { verifyAccessToken, extractBearer } from './lib/jwt-verifier.js';
export { principalFromPayload, type Principal } from './lib/principal.js';
