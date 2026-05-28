import { defineEntity, p } from '@mikro-orm/core';
import type { SupplierProductOwnership } from '@org/users-domain';

export class SupplierProductOwnershipEntity implements SupplierProductOwnership {
  supplierId!: string;
  productDatabaseId!: number;
  createdAt!: Date;
}

export const SupplierProductOwnershipEntitySchema = defineEntity({
  class: SupplierProductOwnershipEntity,
  className: 'SupplierProductOwnershipEntity',
  tableName: 'supplier_product_ownership',
  properties: {
    // One owner per product — the WooCommerce databaseId is the natural key.
    productDatabaseId: p.integer().primary().fieldName('product_database_id'),
    supplierId: p.string().fieldName('supplier_id'),
    createdAt: p.datetime().fieldName('created_at'),
  },
});
