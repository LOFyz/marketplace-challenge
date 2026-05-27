import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

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

@ObjectType('User')
@Directive('@key(fields: "id")')
export class UserType {
  @Field(() => ID) id!: string;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) name?: string;
  @Field(() => [SupplierType]) ownedSuppliers?: SupplierType[];
}
