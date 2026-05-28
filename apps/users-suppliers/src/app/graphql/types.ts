import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('Supplier')
@Directive('@key(fields: "id")')
export class SupplierType {
  @Field(() => ID) id!: string;
  @Field() legalName!: string;
  @Field() taxId!: string;
  // Carried on the resolved object so SupplierResolver's @ResolveField can resolve
  // `owner` (declared there, not here — avoids a circular class reference).
  ownerId!: string;
}

// `AppUser` (not `User`) so we don't collide with WPGraphQL's `User` type in the
// supergraph (per escopo §6.1's diagram + prior reference impl [[prior-challenge-reference]]).
@ObjectType('AppUser')
@Directive('@key(fields: "id")')
export class UserType {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) name?: string;
  @Field(() => [SupplierType]) ownedSuppliers?: SupplierType[];
}

// The WooCommerce-origin `SimpleProduct` entity (its base type + most fields live in
// the WordPress catalog subgraph). This subgraph contributes the owning `supplier`,
// keyed on the WooCommerce `databaseId`. `supplier` is declared by SimpleProductResolver
// (@ResolveField) — mirrors the Supplier.owner pattern, avoids a circular class ref.
@ObjectType('SimpleProduct')
@Directive('@key(fields: "databaseId")')
export class SimpleProductType {
  @Field(() => Int) databaseId!: number;
}
