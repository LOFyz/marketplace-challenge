import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Cart, CartItem, CartRepository } from '@org/orders-domain';
import { CartEntitySchema, CartItemEntitySchema } from '../entities/cart.entity.js';

@Injectable()
export class MikroCartRepository implements CartRepository {
  constructor(private readonly em: EntityManager) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    return this.em.findOne(CartEntitySchema, { userId });
  }

  async findById(id: string): Promise<Cart | null> {
    return this.em.findOne(CartEntitySchema, { id });
  }

  async getOrCreateForUser(userId: string): Promise<Cart> {
    const existing = await this.em.findOne(CartEntitySchema, { userId });
    if (existing) return existing;
    const now = new Date();
    const cart = this.em.create(CartEntitySchema, {
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
    });
    this.em.persist(cart);
    await this.em.flush();
    return cart;
  }

  async listItems(cartId: string): Promise<CartItem[]> {
    return this.em.find(CartItemEntitySchema, { cartId });
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    const existing = await this.em.findOne(CartItemEntitySchema, {
      cartId,
      productId,
    });
    if (existing) {
      existing.quantity += quantity;
      await this.em.flush();
      return existing;
    }
    const item = this.em.create(CartItemEntitySchema, {
      id: randomUUID(),
      cartId,
      productId,
      quantity,
    });
    this.em.persist(item);
    await this.em.flush();
    return item;
  }

  async removeItem(cartId: string, productId: string): Promise<void> {
    const item = await this.em.findOne(CartItemEntitySchema, {
      cartId,
      productId,
    });
    if (item) {
      this.em.remove(item);
      await this.em.flush();
    }
  }
}
