import type {
  Supplier,
  SupplierMembership,
  SupplierProductOwnership,
  SupplierRole,
  User,
} from './models.js';

/** Read port for users (the user table is owned by Better Auth). */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';

/** Repository port for the Supplier aggregate (implemented in infrastructure). */
export interface SupplierRepository {
  findById(id: string): Promise<Supplier | null>;
  findByOwnerId(ownerId: string): Promise<Supplier[]>;
  create(input: {
    legalName: string;
    taxId: string;
    ownerId: string;
  }): Promise<Supplier>;
}

export const SUPPLIER_REPOSITORY = 'SUPPLIER_REPOSITORY';

export interface MembershipRepository {
  create(input: {
    supplierId: string;
    userId: string;
    role: SupplierRole;
  }): Promise<SupplierMembership>;
  findByUserId(userId: string): Promise<SupplierMembership[]>;
}

export const MEMBERSHIP_REPOSITORY = 'MEMBERSHIP_REPOSITORY';

/** Repository port for supplier-product ownership (source of truth for O2). */
export interface OwnershipRepository {
  /** The ownership record for a product, or null if the product has no recorded owner. */
  findByProductDatabaseId(
    productDatabaseId: number,
  ): Promise<SupplierProductOwnership | null>;
  /** Idempotent upsert keyed on `productDatabaseId` (no duplicate owners). */
  upsert(input: {
    supplierId: string;
    productDatabaseId: number;
  }): Promise<SupplierProductOwnership>;
}

export const OWNERSHIP_REPOSITORY = 'OWNERSHIP_REPOSITORY';
