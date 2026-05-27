export { CreateSupplierCommand } from './lib/commands/create-supplier.command.js';
export { CreateSupplierHandler } from './lib/commands/create-supplier.handler.js';
export { GetMeQuery } from './lib/queries/get-me.query.js';
export { GetMeHandler, type MeView } from './lib/queries/get-me.handler.js';

import { CreateSupplierHandler } from './lib/commands/create-supplier.handler.js';
import { GetMeHandler } from './lib/queries/get-me.handler.js';

/** CQRS handlers to register in the subgraph app's module. */
export const UsersCommandHandlers = [CreateSupplierHandler];
export const UsersQueryHandlers = [GetMeHandler];
