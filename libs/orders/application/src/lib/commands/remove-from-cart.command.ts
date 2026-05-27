export class RemoveFromCartCommand {
  constructor(
    public readonly userId: string,
    public readonly productId: string,
  ) {}
}
