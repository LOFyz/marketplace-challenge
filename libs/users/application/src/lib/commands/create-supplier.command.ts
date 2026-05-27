export class CreateSupplierCommand {
  constructor(
    public readonly ownerId: string,
    public readonly legalName: string,
    public readonly taxId: string,
  ) {}
}
