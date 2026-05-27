import { Logger } from '@nestjs/common';
import type { BetterAuthOptions } from 'better-auth';
import { betterAuth } from 'better-auth';
import { jwt, oidcProvider } from 'better-auth/plugins';

export interface BetterAuthConfig {
  secret: string;
  baseUrl: string;
  basePath: string;
  trustedOrigins: string[];
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;
  /** JWT issuer + audience for the OAuth2 access tokens (escopo §7). */
  issuer: string;
  audience: string;
  /** Default login page the OIDC provider redirects unauthenticated users to. */
  loginPage: string;
}

/**
 * Minimal, nameable view of the Better Auth instance the app consumes. We expose
 * only the request `handler` and the `api` surface; this avoids leaking Better
 * Auth's deeply-generic inferred type into our declaration output.
 */
export interface BetterAuth {
  handler: (request: Request) => Promise<Response>;
  api: Record<string, (...args: never[]) => unknown>;
  options: unknown;
}

/**
 * Better Auth as an OAuth2 Authorization Server (escopo §7).
 *
 * Reuses the prior challenge's wiring (email+password, Google social login) and
 * ADAPTS it for this challenge: the `jwt` plugin issues RS256-signed tokens and
 * exposes JWKS; the `oidcProvider` plugin adds Authorization Code + PKCE, the
 * discovery document, client registration, and scopes. Tokens carry `roles` and
 * (when present) `supplier_id` claims.
 */
export function initAuth(
  config: BetterAuthConfig,
  // adapter built from the shared MikroORM connection (see kysely factory)
  adapter: BetterAuthOptions['database'],
): BetterAuth {
  const logger = new Logger('BetterAuth');

  return betterAuth({
    basePath: config.basePath,
    baseURL: config.baseUrl,
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    database: adapter,
    logger: {
      disabled: false,
      log(level, message, ...args) {
        const fn = (logger as unknown as Record<string, (m: string, ...a: unknown[]) => void>)[level];
        fn?.call(logger, message, ...args);
      },
    },
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: config.googleClientId ?? '',
        clientSecret: config.googleClientSecret ?? '',
        enabled: !!config.googleClientId,
      },
    },
    plugins: [
      jwt({
        // RS256 asymmetric keypair so resource servers verify via JWKS (escopo §7).
        jwks: { keyPairConfig: { alg: 'RS256', modulusLength: 2048 } },
        jwt: {
          issuer: config.issuer,
          audience: config.audience,
          expirationTime: '15m',
          definePayload: ({ user }) => {
            const u = user as Record<string, unknown>;
            return {
              roles: (u['roles'] as string[]) ?? ['customer'],
              ...(u['supplierId'] ? { supplier_id: u['supplierId'] } : {}),
            };
          },
        },
        // Recommended when pairing with the OIDC provider: don't auto-sign sessions.
        disableSettingJwtHeader: true,
      }),
      oidcProvider({
        loginPage: config.loginPage,
        // Curated marketplace scopes (escopo §7.2 / §8).
        scopes: [
          'openid',
          'profile',
          'email',
          'cart:read',
          'cart:write',
          'orders:read',
          'mcp:read',
        ],
        allowDynamicClientRegistration: false,
        getAdditionalUserInfoClaim: (user) => {
          const u = user as Record<string, unknown>;
          return {
            roles: (u['roles'] as string[]) ?? ['customer'],
            ...(u['supplierId'] ? { supplier_id: u['supplierId'] } : {}),
          };
        },
      }),
    ],
  }) as unknown as BetterAuth;
}
