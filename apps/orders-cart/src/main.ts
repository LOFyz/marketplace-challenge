import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module.js';

// orders-cart federated subgraph (escopo §4.4). GraphQL at /graphql.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`🛒 orders-cart subgraph on http://localhost:${port}/graphql`);
}

bootstrap();
