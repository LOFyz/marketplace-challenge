import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CART_REPOSITORY, type CartRepository } from '@org/orders-domain';
import { AddToCartCommand } from './add-to-cart.command.js';
import type { CartView } from '../cart-view.js';

@CommandHandler(AddToCartCommand)
export class AddToCartHandler implements ICommandHandler<AddToCartCommand, CartView> {
  constructor(@Inject(CART_REPOSITORY) private readonly carts: CartRepository) {}

  async execute(cmd: AddToCartCommand): Promise<CartView> {
    const cart = await this.carts.getOrCreateForUser(cmd.userId);
    await this.carts.addItem(cart.id, cmd.productId, cmd.quantity);
    const items = await this.carts.listItems(cart.id);
    return { cart, items };
  }
}
