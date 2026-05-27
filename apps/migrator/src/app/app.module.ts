import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DbModule, createMikroOrmOptions } from '@org/db';
import {
  SupplierEntitySchema,
  SupplierMembershipEntitySchema,
} from '@org/users-infrastructure';
import { OrdersEntities } from '@org/orders-infrastructure';

// Marketplace-owned tables only. The `user`/auth tables are owned by Better Auth
// (created via its own migration), so they are intentionally excluded here.
const MarketplaceEntities = [
  SupplierEntitySchema,
  SupplierMembershipEntitySchema,
  ...OrdersEntities,
];

@Module({
  imports: [
    DbModule,
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: (config: ConfigService) =>
        createMikroOrmOptions(config, MarketplaceEntities),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
