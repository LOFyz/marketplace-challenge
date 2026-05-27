import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type {
  MembershipRepository,
  SupplierMembership,
  SupplierRole,
} from '@org/users-domain';
import { SupplierMembershipEntitySchema } from '../entities/supplier-membership.entity.js';

@Injectable()
export class MikroMembershipRepository implements MembershipRepository {
  constructor(private readonly em: EntityManager) {}

  async create(input: {
    supplierId: string;
    userId: string;
    role: SupplierRole;
  }): Promise<SupplierMembership> {
    const membership = this.em.create(SupplierMembershipEntitySchema, {
      id: randomUUID(),
      supplierId: input.supplierId,
      userId: input.userId,
      role: input.role,
      createdAt: new Date(),
    });
    this.em.persist(membership);
    await this.em.flush();
    return membership;
  }

  async findByUserId(userId: string): Promise<SupplierMembership[]> {
    return this.em.find(SupplierMembershipEntitySchema, { userId });
  }
}
