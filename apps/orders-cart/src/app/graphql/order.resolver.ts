import { Inject } from '@nestjs/common';
import { ResolveReference, Resolver } from '@nestjs/graphql';
import { ORDER_REPOSITORY, type OrderRepository } from '@org/orders-domain';
import { OrderType } from './types.js';

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  @ResolveReference()
  async resolveReference(ref: {
    __typename: string;
    id: string;
  }): Promise<OrderType | null> {
    const order = await this.orders.findById(ref.id);
    return order
      ? { id: order.id, status: order.status, total: order.total }
      : null;
  }
}
