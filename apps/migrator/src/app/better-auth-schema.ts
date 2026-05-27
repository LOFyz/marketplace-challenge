/**
 * Better Auth schema (escopo §7) — created here so the whole DB comes up with a
 * single `migrator` pass (`docker compose up`), alongside the marketplace tables.
 *
 * Better Auth owns these tables; MikroORM only *reads* `user` (see `UserEntity`).
 * The column set is the authoritative output of Better Auth's own schema for OUR
 * plugin set (v1.6.11): base (`user`/`session`/`account`/`verification`) + the
 * `jwt` plugin (`jwks`) + the `oidcProvider` plugin (`oauth_application`,
 * `oauth_access_token`, `oauth_consent`). Names are **snake_case** to match the
 * runtime Kysely adapter's `CamelCasePlugin` (camelCase fields ⇄ snake_case
 * columns) — the same convention the prior challenge uses.
 *
 * Statements are idempotent (`CREATE TABLE IF NOT EXISTS`) so re-running the
 * migrator is safe.
 */
export const BETTER_AUTH_SCHEMA_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "email_verified" boolean NOT NULL DEFAULT false,
    "image" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamptz NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamptz,
    "refresh_token_expires_at" timestamptz,
    "scope" text,
    "password" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );`,

  // jwt plugin — asymmetric RS256 keypair store (public key served at /auth/jwks).
  `CREATE TABLE IF NOT EXISTS "jwks" (
    "id" text PRIMARY KEY NOT NULL,
    "public_key" text NOT NULL,
    "private_key" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "expires_at" timestamptz
  );`,

  // oidcProvider plugin — registered OAuth2 clients. `client_id` is UNIQUE because
  // the access-token / consent rows look clients up by it (not the surrogate id).
  `CREATE TABLE IF NOT EXISTS "oauth_application" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text,
    "icon" text,
    "metadata" text,
    "client_id" text UNIQUE,
    "client_secret" text,
    "redirect_urls" text,
    "type" text,
    "disabled" boolean DEFAULT false,
    "user_id" text REFERENCES "user" ("id") ON DELETE CASCADE,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "oauth_access_token" (
    "id" text PRIMARY KEY NOT NULL,
    "access_token" text UNIQUE,
    "refresh_token" text UNIQUE,
    "access_token_expires_at" timestamptz,
    "refresh_token_expires_at" timestamptz,
    "client_id" text,
    "user_id" text REFERENCES "user" ("id") ON DELETE CASCADE,
    "scopes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "oauth_consent" (
    "id" text PRIMARY KEY NOT NULL,
    "client_id" text,
    "user_id" text REFERENCES "user" ("id") ON DELETE CASCADE,
    "scopes" text,
    "consent_given" boolean,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
  );`,
];

/** Runs the Better Auth DDL through any executor (e.g. MikroORM's connection). */
export async function ensureBetterAuthSchema(
  execute: (sql: string) => Promise<unknown>,
): Promise<void> {
  for (const sql of BETTER_AUTH_SCHEMA_SQL) {
    await execute(sql);
  }
}

export interface DevOAuthClients {
  /** Public SPA client (Authorization Code + PKCE, no secret). */
  webRedirectUri: string;
  /** Confidential machine client for the MCP server (Client Credentials). */
  mcpClientSecret: string;
}

/**
 * Seeds the two dev OAuth2 clients the marketplace ships with (escopo §7/§8), so
 * the OIDC provider has registered clients out of the box (`docker compose up`):
 *
 * - `marketplace-web`  — public client, Authorization Code + PKCE (no secret).
 * - `marketplace-mcp`  — confidential client for the Apollo MCP server.
 *
 * Dynamic client registration is disabled in `initAuth`, so clients are seeded
 * here instead. Secrets are stored as-is (Better Auth's default `storeClientSecret`
 * is plaintext), so the confidential client validates without extra hashing.
 * Idempotent via `ON CONFLICT (client_id)`.
 */
export async function seedDevOAuthClients(
  execute: (sql: string, params: unknown[]) => Promise<unknown>,
  clients: DevOAuthClients,
): Promise<void> {
  const insert = `INSERT INTO "oauth_application"
      ("id", "name", "client_id", "client_secret", "redirect_urls", "type", "disabled")
    VALUES (?, ?, ?, ?, ?, ?, false)
    ON CONFLICT ("client_id") DO NOTHING;`;

  await execute(insert, [
    'app_marketplace_web',
    'Marketplace Web',
    'marketplace-web',
    null,
    clients.webRedirectUri,
    'public',
  ]);
  await execute(insert, [
    'app_marketplace_mcp',
    'Marketplace MCP',
    'marketplace-mcp',
    clients.mcpClientSecret,
    '',
    'web',
  ]);
}
