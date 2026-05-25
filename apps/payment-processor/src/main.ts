import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

// Payment Processor — RabbitMQ microservice (escopo §4.5, §9). Consumes `order.placed`
// and emits PaymentAuthorized / PaymentFailed with idempotency. Message handlers
// (@EventPattern) and the saga logic land in the payments change.
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'payment_processor_queue',
      queueOptions: { durable: true },
    },
  });
  await app.listen();
  Logger.log('💳 Payment Processor listening on RabbitMQ');
}

bootstrap();
