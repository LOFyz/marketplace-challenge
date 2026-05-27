import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MikroORM } from '@mikro-orm/core';
import { AppModule } from './app/app.module.js';
import {
  ensureBetterAuthSchema,
  seedDevOAuthClients,
} from './app/better-auth-schema.js';

// One-shot migrator: brings the whole DB up to date, then exits.
// 1) marketplace tables (MikroORM schema diff over the entities),
// 2) Better Auth tables (its own snake_case schema — see better-auth-schema.ts),
// 3) dev OAuth2 clients (escopo §3.6 / §7) — idempotent seed.
async function bootstrap() {
  const ctx = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const orm = ctx.get(MikroORM) as unknown as {
    schema: {
      ensureDatabase(): Promise<boolean>;
      update(opts?: { safe?: boolean }): Promise<void>;
    };
    em: { getConnection(): { execute(sql: string, params?: readonly unknown[], method?: 'all' | 'get' | 'run'): Promise<unknown> } };
  };
  const config = ctx.get(ConfigService);

  await orm.schema.ensureDatabase();

  // Better Auth owns the `user` table; create its schema first so the
  // marketplace schema diff (which reads `user`) sees a complete table.
  const connection = orm.em.getConnection();
  await ensureBetterAuthSchema((sql) => connection.execute(sql, [], 'run'));
  Logger.log('✅ Better Auth schema is up to date', 'Migrator');

  await orm.schema.update({ safe: true });
  Logger.log('✅ Marketplace schema is up to date', 'Migrator');

  await seedDevOAuthClients(
    (sql, params) => connection.execute(sql, params as readonly unknown[], 'run'),
    {
      webRedirectUri:
        config.get<string>('OAUTH_WEB_REDIRECT_URI') ??
        'http://localhost:3000/callback',
      mcpClientSecret:
        config.get<string>('OAUTH_MCP_CLIENT_SECRET') ?? 'dev-mcp-secret',
    },
  );
  Logger.log('✅ Dev OAuth clients seeded', 'Migrator');

  await ctx.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  Logger.error(`Migrator failed: ${(err as Error).message}`, undefined, 'Migrator');
  process.exit(1);
});
