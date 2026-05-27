import type { FactoryProvider } from '@nestjs/common';
import type { BetterAuthOptions } from 'better-auth';
import type { BetterAuthConfig } from '../init-auth.js';
import { initAuth } from '../init-auth.js';
import { BETTER_AUTH_DATABASE_ADAPTER_TOKEN } from './auth-database-kysely.factory.js';

export const BETTER_AUTH_TOKEN = 'BETTER_AUTH';
export const BETTER_AUTH_CONFIG_TOKEN = 'BETTER_AUTH_CONFIG';

export const BetterAuthFactory: FactoryProvider = {
  provide: BETTER_AUTH_TOKEN,
  useFactory(config: BetterAuthConfig, adapter: BetterAuthOptions['database']) {
    return initAuth(config, adapter);
  },
  inject: [BETTER_AUTH_CONFIG_TOKEN, BETTER_AUTH_DATABASE_ADAPTER_TOKEN],
};
