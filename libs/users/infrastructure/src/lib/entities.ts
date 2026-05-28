import { UserEntitySchema } from './entities/user.entity.js';
import { SupplierEntitySchema } from './entities/supplier.entity.js';
import { SupplierMembershipEntitySchema } from './entities/supplier-membership.entity.js';
import { SupplierProductOwnershipEntitySchema } from './entities/supplier-product-ownership.entity.js';

/** Entity schema list for MikroORM registration + migrations. */
export const UsersEntities = [
  UserEntitySchema,
  SupplierEntitySchema,
  SupplierMembershipEntitySchema,
  SupplierProductOwnershipEntitySchema,
];
