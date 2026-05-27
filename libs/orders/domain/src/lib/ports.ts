import type { Cart, CartItem, Order } from './models.js';

export interface CartRepository {
  getOrCreateForUser(userId: string): Promise<Cart>;
  findByUserId(userId: string): Promise<Cart | null>;
  findById(id: string): Promise<Cart | null>;
  listItems(cartId: string): Promise<CartItem[]>;
  addItem(cartId: string, productId: string, quantity: number): Promise<CartItem>;
  removeItem(cartId: string, productId: string): Promise<void>;
}

export const CART_REPOSITORY = 'CART_REPOSITORY';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
}

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
