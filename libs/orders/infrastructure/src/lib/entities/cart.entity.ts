import { defineEntity, p } from '@mikro-orm/core';
import type { Cart, CartItem } from '@org/orders-domain';

export class CartEntity implements Cart {
  id!: string;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CartEntitySchema = defineEntity({
  class: CartEntity,
  className: 'CartEntity',
  tableName: 'cart',
  properties: {
    id: p.string().primary(),
    userId: p.string().unique().fieldName('user_id'),
    createdAt: p.datetime().fieldName('created_at'),
    updatedAt: p.datetime().fieldName('updated_at'),
  },
});

export class CartItemEntity implements CartItem {
  id!: string;
  cartId!: string;
  productId!: string;
  quantity!: number;
}

export const CartItemEntitySchema = defineEntity({
  class: CartItemEntity,
  className: 'CartItemEntity',
  tableName: 'cart_item',
  properties: {
    id: p.string().primary(),
    cartId: p.string().fieldName('cart_id'),
    productId: p.string().fieldName('product_id'),
    quantity: p.integer(),
  },
});
