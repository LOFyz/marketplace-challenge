export type { CartView } from './lib/cart-view.js';
export { GetMyCartQuery } from './lib/queries/get-my-cart.query.js';
export { GetMyCartHandler } from './lib/queries/get-my-cart.handler.js';
export { AddToCartCommand } from './lib/commands/add-to-cart.command.js';
export { AddToCartHandler } from './lib/commands/add-to-cart.handler.js';
export { RemoveFromCartCommand } from './lib/commands/remove-from-cart.command.js';
export { RemoveFromCartHandler } from './lib/commands/remove-from-cart.handler.js';

import { GetMyCartHandler } from './lib/queries/get-my-cart.handler.js';
import { AddToCartHandler } from './lib/commands/add-to-cart.handler.js';
import { RemoveFromCartHandler } from './lib/commands/remove-from-cart.handler.js';

export const OrdersQueryHandlers = [GetMyCartHandler];
export const OrdersCommandHandlers = [AddToCartHandler, RemoveFromCartHandler];
