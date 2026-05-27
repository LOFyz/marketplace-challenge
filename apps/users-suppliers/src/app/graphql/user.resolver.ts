import { Context, Query, ResolveReference, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetMeQuery, type MeView } from '@org/users-application';
import { SupplierType, UserType } from './types.js';
import type { SubgraphContext } from '../context.js';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly queryBus: QueryBus) {}

  @Query(() => UserType, { nullable: true })
  async me(@Context() ctx: SubgraphContext): Promise<UserType | null> {
    if (!ctx.userId) return null;
    const view = await this.queryBus.execute<GetMeQuery, MeView>(
      new GetMeQuery(ctx.userId),
    );
    if (!view.user) return null;
    return {
      id: view.user.id,
      email: view.user.email,
      name: view.user.name,
      ownedSuppliers: view.ownedSuppliers as SupplierType[],
    };
  }

  @ResolveReference()
  resolveReference(ref: { __typename: string; id: string }): UserType {
    return { id: ref.id };
  }
}
