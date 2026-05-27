import { defineEntity, p } from '@mikro-orm/core';
import type { Supplier } from '@org/users-domain';

export class SupplierEntity implements Supplier {
  id!: string;
  legalName!: string;
  taxId!: string;
  ownerId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const SupplierEntitySchema = defineEntity({
  class: SupplierEntity,
  className: 'SupplierEntity',
  tableName: 'supplier',
  properties: {
    id: p.string().primary(),
    legalName: p.string().fieldName('legal_name'),
    taxId: p.string().unique().fieldName('tax_id'),
    ownerId: p.string().fieldName('owner_id'),
    createdAt: p.datetime().fieldName('created_at'),
    updatedAt: p.datetime().fieldName('updated_at'),
  },
});
