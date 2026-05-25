import { Controller } from '@nestjs/common';

// RabbitMQ event handlers (e.g. @EventPattern('order.placed')) are added in the
// payments/saga change. No HTTP routes — this service runs as a microservice.
@Controller()
export class AppController {}
