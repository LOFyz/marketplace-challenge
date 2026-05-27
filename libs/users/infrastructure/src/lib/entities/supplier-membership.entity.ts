import { defineEntity, p } from '@mikro-orm/core';
import type { SupplierMembership, SupplierRole } from '@org/users-domain';

export class SupplierMembershipEntity implements SupplierMembership {
  id!: string;
  supplierId!: string;
  userId!: string;
  role!: SupplierRole;
  createdAt!: Date;
}

export const SupplierMembershipEntitySchema = defineEntity({
  class: SupplierMembershipEntity,
  className: 'SupplierMembershipEntity',
  tableName: 'supplier_membership',
  properties: {
    id: p.string().primary(),
    supplierId: p.string().fieldName('supplier_id'),
    userId: p.string().fieldName('user_id'),
    role: p.string().$type<SupplierRole>(),
    createdAt: p.datetime().fieldName('created_at'),
  },
});
