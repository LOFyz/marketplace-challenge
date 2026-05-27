import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CartItem')
export class CartItemType {
  @Field(() => ID) id!: string;
  // Scalar reference to a WooCommerce product (no federated Product yet).
  @Field(() => ID) productId!: string;
  @Field(() => Int) quantity!: number;
}

@ObjectType('Cart')
@Directive('@key(fields: "id")')
export class CartType {
  @Field(() => ID) id!: string;
  @Field(() => ID) userId!: string;
  @Field(() => [CartItemType]) items!: CartItemType[];
}

@ObjectType('Order')
@Directive('@key(fields: "id")')
export class OrderType {
  @Field(() => ID) id!: string;
  @Field() status!: string;
  @Field(() => Int) total!: number;
}
