import { UserEntitySchema } from './entities/user.entity.js';
import { SupplierEntitySchema } from './entities/supplier.entity.js';
import { SupplierMembershipEntitySchema } from './entities/supplier-membership.entity.js';

/** Entity schema list for MikroORM registration + migrations. */
export const UsersEntities = [
  UserEntitySchema,
  SupplierEntitySchema,
  SupplierMembershipEntitySchema,
];
