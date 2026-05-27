import { MikroORM } from '@mikro-orm/core';
import type { PostgreSqlConnection } from '@mikro-orm/postgresql';
import { kyselyAdapter } from '@better-auth/kysely-adapter';
import type { FactoryProvider } from '@nestjs/common';
import { CamelCasePlugin, Kysely } from 'kysely';

export const AUTH_DATABASE_KYSELY_TOKEN = 'AUTH_DATABASE_KYSELY';
export const BETTER_AUTH_DATABASE_ADAPTER_TOKEN = 'BETTER_AUTH_DATABASE_ADAPTER';

/**
 * Bridges Better Auth onto the same Postgres connection MikroORM owns: build a
 * Kysely instance from MikroORM's connection so Better Auth's tables live in the
 * shared DB without a second pool. (Pattern reused from the prior challenge.)
 */
export const AuthDatabaseKyselyFactory = {
  provide: AUTH_DATABASE_KYSELY_TOKEN,
  useFactory(orm: MikroORM) {
    const connection = orm.em.getConnection() as PostgreSqlConnection;
    const dialect = connection.createKyselyDialect({});
    return new Kysely({ dialect, plugins: [new CamelCasePlugin()] });
  },
  inject: [MikroORM],
} satisfies FactoryProvider;

export type AuthKysely = ReturnType<typeof AuthDatabaseKyselyFactory.useFactory>;

export const BetterAuthDatabaseAdapterFactory: FactoryProvider = {
  provide: BETTER_AUTH_DATABASE_ADAPTER_TOKEN,
  useFactory(kysely: AuthKysely) {
    return kyselyAdapter(kysely as never, { type: 'postgres', transaction: true });
  },
  inject: [AUTH_DATABASE_KYSELY_TOKEN],
};
