import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { OwnershipRepository, SupplierProductOwnership } from '@org/users-domain';
import { SupplierProductOwnershipEntitySchema } from '../entities/supplier-product-ownership.entity.js';

@Injectable()
export class MikroOwnershipRepository implements OwnershipRepository {
  constructor(private readonly em: EntityManager) {}

  async findByProductDatabaseId(
    productDatabaseId: number,
  ): Promise<SupplierProductOwnership | null> {
    return this.em.findOne(SupplierProductOwnershipEntitySchema, {
      productDatabaseId,
    });
  }

  async upsert(input: {
    supplierId: string;
    productDatabaseId: number;
  }): Promise<SupplierProductOwnership> {
    const existing = await this.em.findOne(SupplierProductOwnershipEntitySchema, {
      productDatabaseId: input.productDatabaseId,
    });
    if (existing) return existing;
    const ownership = this.em.create(SupplierProductOwnershipEntitySchema, {
      productDatabaseId: input.productDatabaseId,
      supplierId: input.supplierId,
      createdAt: new Date(),
    });
    this.em.persist(ownership);
    await this.em.flush();
    return ownership;
  }
}
