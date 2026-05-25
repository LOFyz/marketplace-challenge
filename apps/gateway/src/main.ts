import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

// Apollo Gateway (escopo §4.1) — composes the federated supergraph. The Apollo
// Federation driver is configured in AppModule's GraphQLModule.forRoot.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Gateway ready at http://localhost:${port}/graphql`);
}

bootstrap();
