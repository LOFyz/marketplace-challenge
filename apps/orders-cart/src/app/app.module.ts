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
import { CART_REPOSITORY, ORDER_REPOSITORY } from '@org/orders-domain';
import {
  MikroCartRepository,
  MikroOrderRepository,
  OrdersEntities,
} from '@org/orders-infrastructure';
import {
  OrdersCommandHandlers,
  OrdersQueryHandlers,
} from '@org/orders-application';
import { CartResolver } from './graphql/cart.resolver.js';
import { OrderResolver } from './graphql/order.resolver.js';
import { OrderType } from './graphql/types.js';
import { contextFromHeaders } from './context.js';

@Module({
  imports: [
    DbModule,
    CqrsModule.forRoot(),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: (config: ConfigService) =>
        createMikroOrmOptions(config, OrdersEntities),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2, path: 'apps/orders-cart/schema.gql' },
      // Order is a federation entity resolved only by reference (no local query
      // until placeOrder/saga lands), so register it as an orphaned type.
      buildSchemaOptions: { orphanedTypes: [OrderType] },
      context: ({ req }: { req: { headers: Record<string, string | string[] | undefined> } }) =>
        contextFromHeaders(req.headers),
    }),
  ],
  providers: [
    { provide: CART_REPOSITORY, useClass: MikroCartRepository },
    { provide: ORDER_REPOSITORY, useClass: MikroOrderRepository },
    ...OrdersCommandHandlers,
    ...OrdersQueryHandlers,
    CartResolver,
    OrderResolver,
  ],
})
export class AppModule {}
