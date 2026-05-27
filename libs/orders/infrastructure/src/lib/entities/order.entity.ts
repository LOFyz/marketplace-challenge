import { defineEntity, p } from '@mikro-orm/core';
import type { Order, OrderStatus } from '@org/orders-domain';

export class OrderEntity implements Order {
  id!: string;
  userId!: string;
  status!: OrderStatus;
  total!: number;
  createdAt!: Date;
}

export const OrderEntitySchema = defineEntity({
  class: OrderEntity,
  className: 'OrderEntity',
  tableName: 'order',
  properties: {
    id: p.string().primary(),
    userId: p.string().fieldName('user_id'),
    status: p.string().$type<OrderStatus>(),
    total: p.integer(),
    createdAt: p.datetime().fieldName('created_at'),
  },
});
