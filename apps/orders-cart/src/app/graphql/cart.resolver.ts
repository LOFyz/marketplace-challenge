import { Inject, UnauthorizedException } from '@nestjs/common';
import {
  Args,
  Context,
  Int,
  Mutation,
  Query,
  ResolveReference,
  Resolver,
} from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AddToCartCommand,
  GetMyCartQuery,
  RemoveFromCartCommand,
  type CartView,
} from '@org/orders-application';
import { CART_REPOSITORY, type CartRepository } from '@org/orders-domain';
import { CartType } from './types.js';
import type { SubgraphContext } from '../context.js';

@Resolver(() => CartType)
export class CartResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
  ) {}

  @Query(() => CartType, { nullable: true })
  async myCart(@Context() ctx: SubgraphContext): Promise<CartType | null> {
    if (!ctx.userId) return null;
    const view = await this.queryBus.execute<GetMyCartQuery, CartView>(
      new GetMyCartQuery(ctx.userId),
    );
    return this.toType(view);
  }

  @Mutation(() => CartType)
  async addToCart(
    @Args('productId') productId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Context() ctx: SubgraphContext,
  ): Promise<CartType> {
    if (!ctx.userId) throw new UnauthorizedException('Authentication required');
    const view = await this.commandBus.execute<AddToCartCommand, CartView>(
      new AddToCartCommand(ctx.userId, productId, quantity),
    );
    return this.toType(view);
  }

  @Mutation(() => CartType)
  async removeFromCart(
    @Args('productId') productId: string,
    @Context() ctx: SubgraphContext,
  ): Promise<CartType> {
    if (!ctx.userId) throw new UnauthorizedException('Authentication required');
    const view = await this.commandBus.execute<RemoveFromCartCommand, CartView>(
      new RemoveFromCartCommand(ctx.userId, productId),
    );
    return this.toType(view);
  }

  @ResolveReference()
  async resolveReference(ref: {
    __typename: string;
    id: string;
  }): Promise<CartType | null> {
    const cart = await this.carts.findById(ref.id);
    if (!cart) return null;
    const items = await this.carts.listItems(cart.id);
    return this.toType({ cart, items });
  }

  private toType(view: CartView): CartType {
    return {
      id: view.cart.id,
      userId: view.cart.userId,
      items: view.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
  }
}
