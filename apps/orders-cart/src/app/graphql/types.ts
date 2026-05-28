import { Directive, Field, ID, Int, ObjectType } from '@nestjs/graphql';

// Marketplace-prefixed GraphQL names so we don't collide with WooGraphQL's `Cart`,
// `CartItem`, `Order` types in the supergraph (escopo §6.1 uses `MarketplaceOrder`).
@ObjectType('MarketplaceCartItem')
export class CartItemType {
  @Field(() => ID) id!: string;
  // Scalar reference to a WooCommerce product (no federated Product yet).
  @Field(() => ID) productId!: string;
  @Field(() => Int) quantity!: number;
}

@ObjectType('MarketplaceCart')
@Directive('@key(fields: "id")')
export class CartType {
  @Field(() => ID) id!: string;
  @Field(() => ID) userId!: string;
  @Field(() => [CartItemType]) items!: CartItemType[];
}

@ObjectType('MarketplaceOrder')
@Directive('@key(fields: "id")')
export class OrderType {
  @Field(() => ID) id!: string;
  @Field() status!: string;
  @Field(() => Int) total!: number;
}
