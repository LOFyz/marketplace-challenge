import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CART_REPOSITORY, type CartRepository } from '@org/orders-domain';
import { GetMyCartQuery } from './get-my-cart.query.js';
import type { CartView } from '../cart-view.js';

@QueryHandler(GetMyCartQuery)
export class GetMyCartHandler implements IQueryHandler<GetMyCartQuery, CartView> {
  constructor(@Inject(CART_REPOSITORY) private readonly carts: CartRepository) {}

  async execute(query: GetMyCartQuery): Promise<CartView> {
    const cart = await this.carts.getOrCreateForUser(query.userId);
    const items = await this.carts.listItems(cart.id);
    return { cart, items };
  }
}
