import { Controller } from '@nestjs/common';

// RabbitMQ event handlers (e.g. @EventPattern('payment.authorized')) are added in the
// saga change. No HTTP routes — this service runs as a microservice.
@Controller()
export class AppController {}
