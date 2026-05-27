import { ConfigService } from '@nestjs/config';
import type { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver, SchemaGenerator } from '@mikro-orm/postgresql';
import type { EntitySchema } from '@mikro-orm/core';

/**
 * Base MikroORM options for the shared marketplace Postgres database.
 *
 * Entities are passed EXPLICITLY (as `EntitySchema` lists from the infrastructure
 * libs) and dynamic file access is disabled, so the config is safe under webpack
 * bundling (no glob discovery / no reflection at runtime) — the same approach the
 * prior challenge uses. Connection comes from discrete `DB_*` env vars.
 */
export function createMikroOrmOptions(
  config: ConfigService,
  entities: EntitySchema[],
): MikroOrmModuleOptions {
  // Managed Postgres (e.g. Aurora) enforces SSL; local docker-compose does not.
  const useSsl = config.get<string>('DB_SSL') === 'true';
  return {
    driver: PostgreSqlDriver,
    host: config.getOrThrow<string>('DB_HOST'),
    port: Number(config.getOrThrow<string>('DB_PORT')),
    dbName: config.getOrThrow<string>('DB_NAME'),
    user: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    ...(useSsl
      ? { driverOptions: { connection: { ssl: { rejectUnauthorized: false } } } }
      : {}),
    // Explicit EntitySchema lists (no globs) → no dynamic file access at runtime,
    // which is what keeps this safe under webpack bundling.
    entities,
    entitiesTs: entities,
    discovery: { warnWhenNoEntities: false },
    // Enables `orm.schema` (used by the migrator's updateSchema).
    extensions: [SchemaGenerator],
  };
}
