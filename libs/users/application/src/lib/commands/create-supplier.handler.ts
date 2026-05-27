import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  MEMBERSHIP_REPOSITORY,
  SUPPLIER_REPOSITORY,
  type MembershipRepository,
  type Supplier,
  type SupplierRepository,
} from '@org/users-domain';
import { CreateSupplierCommand } from './create-supplier.command.js';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler
  implements ICommandHandler<CreateSupplierCommand, Supplier>
{
  constructor(
    @Inject(SUPPLIER_REPOSITORY) private readonly suppliers: SupplierRepository,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(cmd: CreateSupplierCommand): Promise<Supplier> {
    const supplier = await this.suppliers.create({
      legalName: cmd.legalName,
      taxId: cmd.taxId,
      ownerId: cmd.ownerId,
    });
    // The creator becomes the supplier admin (escopo §7.3).
    await this.memberships.create({
      supplierId: supplier.id,
      userId: cmd.ownerId,
      role: 'supplier_admin',
    });
    return supplier;
  }
}
