import { Global, Module } from '@nestjs/common';
import {
  AuthDatabaseKyselyFactory,
  BetterAuthDatabaseAdapterFactory,
} from './providers/auth-database-kysely.factory.js';
import { BetterAuthConfigFactory } from './providers/better-auth-config.factory.js';
import {
  BetterAuthFactory,
  BETTER_AUTH_TOKEN,
} from './providers/better-auth.factory.js';

// Plain @Global module (no dynamic options): every provider derives its config
// from `ConfigService`/env, so there's nothing to pass at registration. (We used
// to `extends ConfigurableModuleClass`, but Nx's webpack swc-loader downlevels a
// native-class `extends` to an ES5 `super.apply(this)` call that crashes at boot —
// and the configurable options were unused anyway.)
@Global()
@Module({
  providers: [
    AuthDatabaseKyselyFactory,
    BetterAuthDatabaseAdapterFactory,
    BetterAuthConfigFactory,
    BetterAuthFactory,
  ],
  exports: [BETTER_AUTH_TOKEN],
})
export class BetterAuthModule {}
