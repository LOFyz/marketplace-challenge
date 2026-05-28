import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MikroORM } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AppModule } from './app/app.module.js';
import {
  ensureBetterAuthSchema,
  seedDevOAuthClients,
} from './app/better-auth-schema.js';
import { seedCatalogOwnership } from './app/catalog-seed.js';

// One-shot migrator. Two modes (selected by MIGRATOR_MODE):
//  - 'migrate' (default): bring the whole DB up to date, then exit —
//    1) marketplace tables (MikroORM schema diff), 2) Better Auth tables,
//    3) dev OAuth2 clients (escopo §3.6 / §7).
//  - 'catalog-seed': link the sample WooCommerce product to a demo supplier
//    (runs after WordPress is federation-ready; resolves the product databaseId
//    from WPGraphQL since the migrator can't know it ahead of time).
async function bootstrap() {
  const mode = process.env['MIGRATOR_MODE'] ?? 'migrate';
  const ctx = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  const config = ctx.get(ConfigService);

  if (mode === 'catalog-seed') {
    const em = (ctx.get(MikroORM).em as EntityManager).fork();
    await seedCatalogOwnership(em, {
      wpUrl: config.get<string>('CATALOG_GRAPHQL_URL') ?? 'http://wordpress/graphql',
      sku: config.get<string>('CATALOG_SAMPLE_SKU') ?? 'MKT-WIDGET-001',
    });
    Logger.log('✅ Catalog ownership seeded', 'Migrator');
    await ctx.close();
    process.exit(0);
  }

  const orm = ctx.get(MikroORM) as unknown as {
    schema: {
      ensureDatabase(): Promise<boolean>;
      update(opts?: { safe?: boolean }): Promise<void>;
    };
    em: { getConnection(): { execute(sql: string, params?: readonly unknown[], method?: 'all' | 'get' | 'run'): Promise<unknown> } };
  };

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
