import { Inject } from '@nestjs/common';
import { Parent, ResolveField, ResolveReference, Resolver } from '@nestjs/graphql';
import {
  OWNERSHIP_REPOSITORY,
  SUPPLIER_REPOSITORY,
  type OwnershipRepository,
  type SupplierRepository,
} from '@org/users-domain';
import { SimpleProductType, SupplierType } from './types.js';

/**
 * Contributes the owning `supplier` to the WooCommerce-origin `SimpleProduct` entity
 * (escopo O2 source of truth). The base `SimpleProduct` and its catalog fields are
 * resolved by the WordPress catalog subgraph; the gateway joins on `databaseId`.
 */
@Resolver(() => SimpleProductType)
export class SimpleProductResolver {
  constructor(
    @Inject(OWNERSHIP_REPOSITORY) private readonly ownership: OwnershipRepository,
    @Inject(SUPPLIER_REPOSITORY) private readonly suppliers: SupplierRepository,
  ) {}

  @ResolveReference()
  resolveReference(ref: {
    __typename: string;
    databaseId: number | string;
  }): SimpleProductType {
    return { databaseId: Number(ref.databaseId) };
  }

  // Null when the product has no recorded owner — we never fabricate one.
  @ResolveField(() => SupplierType, { nullable: true })
  async supplier(@Parent() product: SimpleProductType): Promise<SupplierType | null> {
    const owned = await this.ownership.findByProductDatabaseId(product.databaseId);
    if (!owned) return null;
    const supplier = await this.suppliers.findById(owned.supplierId);
    return supplier
      ? {
          id: supplier.id,
          legalName: supplier.legalName,
          taxId: supplier.taxId,
          ownerId: supplier.ownerId,
        }
      : null;
  }
}
