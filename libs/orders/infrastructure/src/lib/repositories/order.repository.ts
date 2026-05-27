import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Order, OrderRepository } from '@org/orders-domain';
import { OrderEntitySchema } from '../entities/order.entity.js';

@Injectable()
export class MikroOrderRepository implements OrderRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Order | null> {
    return this.em.findOne(OrderEntitySchema, { id });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.em.find(OrderEntitySchema, { userId });
  }
}
