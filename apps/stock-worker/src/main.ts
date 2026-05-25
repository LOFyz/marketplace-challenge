import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

// Stock Reservation Worker — RabbitMQ microservice (escopo §4.6, §9). Reacts to
// `payment.authorized` reserving stock in WooCommerce, emitting StockReserved or a
// PaymentReverted compensation. Message handlers land in the saga change.
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
      queue: 'stock_worker_queue',
      queueOptions: { durable: true },
    },
  });
  await app.listen();
  Logger.log('📦 Stock Worker listening on RabbitMQ');
}

bootstrap();
