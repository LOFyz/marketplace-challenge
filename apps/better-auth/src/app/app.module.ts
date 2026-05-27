import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DbModule, createMikroOrmOptions } from '@org/db';
import { BetterAuthModule } from '@org/auth';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    DbModule,
    // Better Auth manages its own tables via the Kysely adapter over this
    // connection, so MikroORM here only needs the connection (no entities).
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: (config: ConfigService) => createMikroOrmOptions(config, []),
      inject: [ConfigService],
    }),
    BetterAuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
