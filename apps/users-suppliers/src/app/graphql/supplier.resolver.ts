import { Inject, UnauthorizedException } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Parent,
  ResolveField,
  ResolveReference,
  Resolver,
} from '@nestjs/graphql';
import { CommandBus } from '@nestjs/cqrs';
import { CreateSupplierCommand } from '@org/users-application';
import {
  SUPPLIER_REPOSITORY,
  type Supplier,
  type SupplierRepository,
} from '@org/users-domain';
import { SupplierType, UserType } from './types.js';
import type { SubgraphContext } from '../context.js';

@Resolver(() => SupplierType)
export class SupplierResolver {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(SUPPLIER_REPOSITORY) private readonly suppliers: SupplierRepository,
  ) {}

  @Mutation(() => SupplierType)
  async createSupplier(
    @Args('legalName') legalName: string,
    @Args('taxId') taxId: string,
    @Context() ctx: SubgraphContext,
  ): Promise<SupplierType> {
    if (!ctx.userId) throw new UnauthorizedException('Authentication required');
    const supplier = await this.commandBus.execute<CreateSupplierCommand, Supplier>(
      new CreateSupplierCommand(ctx.userId, legalName, taxId),
    );
    return this.toType(supplier);
  }

  @ResolveReference()
  async resolveReference(ref: {
    __typename: string;
    id: string;
  }): Promise<SupplierType | null> {
    const supplier = await this.suppliers.findById(ref.id);
    return supplier ? this.toType(supplier) : null;
  }

  @ResolveField(() => UserType)
  owner(@Parent() supplier: SupplierType): UserType {
    // Federation resolves the rest of User from its owning subgraph.
    return { id: supplier.ownerId };
  }

  private toType(s: Supplier): SupplierType {
    return { id: s.id, legalName: s.legalName, taxId: s.taxId, ownerId: s.ownerId };
  }
}
