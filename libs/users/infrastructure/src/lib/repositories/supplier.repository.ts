import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Supplier, SupplierRepository } from '@org/users-domain';
import { SupplierEntitySchema } from '../entities/supplier.entity.js';

@Injectable()
export class MikroSupplierRepository implements SupplierRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Supplier | null> {
    return this.em.findOne(SupplierEntitySchema, { id });
  }

  async findByOwnerId(ownerId: string): Promise<Supplier[]> {
    return this.em.find(SupplierEntitySchema, { ownerId });
  }

  async create(input: {
    legalName: string;
    taxId: string;
    ownerId: string;
  }): Promise<Supplier> {
    const now = new Date();
    const supplier = this.em.create(SupplierEntitySchema, {
      id: randomUUID(),
      legalName: input.legalName,
      taxId: input.taxId,
      ownerId: input.ownerId,
      createdAt: now,
      updatedAt: now,
    });
    this.em.persist(supplier);
    await this.em.flush();
    return supplier;
  }
}
