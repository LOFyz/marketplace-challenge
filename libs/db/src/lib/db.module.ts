import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Provides the global `ConfigModule` used to build MikroORM options.
 * Apps import `DbModule` and wire `MikroOrmModule.forRootAsync` with
 * `createMikroOrmOptions` + their own `EntitySchema` list.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  exports: [ConfigModule],
})
export class DbModule {}
