import type { Supplier, SupplierMembership, SupplierRole, User } from './models.js';

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
