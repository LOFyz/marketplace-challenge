import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SUPPLIER_REPOSITORY,
  USER_REPOSITORY,
  type Supplier,
  type SupplierRepository,
  type User,
  type UserRepository,
} from '@org/users-domain';
import { GetMeQuery } from './get-me.query.js';

export interface MeView {
  user: User | null;
  ownedSuppliers: Supplier[];
}

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, MeView> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(SUPPLIER_REPOSITORY) private readonly suppliers: SupplierRepository,
  ) {}

  async execute(query: GetMeQuery): Promise<MeView> {
    const [user, ownedSuppliers] = await Promise.all([
      this.users.findById(query.userId),
      this.suppliers.findByOwnerId(query.userId),
    ]);
    return { user, ownedSuppliers };
  }
}
