import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  type ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { DbModule, createMikroOrmOptions } from '@org/db';
import {
  MEMBERSHIP_REPOSITORY,
  OWNERSHIP_REPOSITORY,
  SUPPLIER_REPOSITORY,
  USER_REPOSITORY,
} from '@org/users-domain';
import {
  MikroMembershipRepository,
  MikroOwnershipRepository,
  MikroSupplierRepository,
  MikroUserRepository,
  UsersEntities,
} from '@org/users-infrastructure';
import { UsersCommandHandlers, UsersQueryHandlers } from '@org/users-application';
import { UserResolver } from './graphql/user.resolver.js';
import { SupplierResolver } from './graphql/supplier.resolver.js';
import { SimpleProductResolver } from './graphql/product.resolver.js';
import { SimpleProductType } from './graphql/types.js';
import { contextFromHeaders } from './context.js';

@Module({
  imports: [
    DbModule,
    CqrsModule.forRoot(),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: (config: ConfigService) =>
        createMikroOrmOptions(config, UsersEntities),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2, path: 'apps/users-suppliers/schema.gql' },
      // SimpleProduct is an entity we EXTEND (it originates from the WooCommerce
      // catalog subgraph) and is reached only via _entities — unreachable from any
      // Query/Mutation root, so the code-first generator would otherwise drop it.
      buildSchemaOptions: { orphanedTypes: [SimpleProductType] },
      // Read the gateway-propagated auth context off the request headers.
      context: ({ req }: { req: { headers: Record<string, string | string[] | undefined> } }) =>
        contextFromHeaders(req.headers),
    }),
  ],
  providers: [
    { provide: SUPPLIER_REPOSITORY, useClass: MikroSupplierRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: MikroMembershipRepository },
    { provide: USER_REPOSITORY, useClass: MikroUserRepository },
    { provide: OWNERSHIP_REPOSITORY, useClass: MikroOwnershipRepository },
    ...UsersCommandHandlers,
    ...UsersQueryHandlers,
    UserResolver,
    SupplierResolver,
    SimpleProductResolver,
  ],
})
export class AppModule {}
