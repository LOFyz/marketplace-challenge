import type { Cart, CartItem } from '@org/orders-domain';

export interface CartView {
  cart: Cart;
  items: CartItem[];
}
