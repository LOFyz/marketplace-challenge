// Identity & Supplier bounded context (escopo §5.2). Pure domain types — no ORM.

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SupplierRole = 'supplier_admin' | 'supplier_member';

/** A registered company that owns one or more products (escopo §5.3). */
export interface Supplier {
  id: string;
  legalName: string;
  taxId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Links a `User` to a `Supplier` with a role. */
export interface SupplierMembership {
  id: string;
  supplierId: string;
  userId: string;
  role: SupplierRole;
  createdAt: Date;
}

/**
 * Source of truth for product ownership (escopo §5.3, O2): links a `Supplier` to a
 * WooCommerce product by its `databaseId` (the canonical product identifier). One owner
 * per product — `productDatabaseId` is the key.
 */
export interface SupplierProductOwnership {
  supplierId: string;
  productDatabaseId: number;
  createdAt: Date;
}
