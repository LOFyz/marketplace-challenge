import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { BETTER_AUTH_TOKEN, type BetterAuth } from '@org/auth';
import { AppModule } from './app/app.module.js';

// Better Auth OAuth2 Authorization Server (escopo §7). Better Auth owns its routes
// under the configured basePath (/auth); `bodyParser: false` lets it read raw bodies.
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const auth = app.get<BetterAuth>(BETTER_AUTH_TOKEN);
  app.use('/auth', toNodeHandler(auth as never));

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  Logger.log(`🔐 Better Auth (OAuth2 AS) on http://localhost:${port}/auth`);
}

bootstrap();
