import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CART_REPOSITORY, type CartRepository } from '@org/orders-domain';
import { RemoveFromCartCommand } from './remove-from-cart.command.js';
import type { CartView } from '../cart-view.js';

@CommandHandler(RemoveFromCartCommand)
export class RemoveFromCartHandler
  implements ICommandHandler<RemoveFromCartCommand, CartView>
{
  constructor(@Inject(CART_REPOSITORY) private readonly carts: CartRepository) {}

  async execute(cmd: RemoveFromCartCommand): Promise<CartView> {
    const cart = await this.carts.getOrCreateForUser(cmd.userId);
    await this.carts.removeItem(cart.id, cmd.productId);
    const items = await this.carts.listItems(cart.id);
    return { cart, items };
  }
}
