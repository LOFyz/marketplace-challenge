import { CartEntitySchema, CartItemEntitySchema } from './entities/cart.entity.js';
import { OrderEntitySchema } from './entities/order.entity.js';

/** Entity schema list for MikroORM registration + migrations. */
export const OrdersEntities = [
  CartEntitySchema,
  CartItemEntitySchema,
  OrderEntitySchema,
];
