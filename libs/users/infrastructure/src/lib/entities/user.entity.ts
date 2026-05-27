import { defineEntity, p } from '@mikro-orm/core';
import type { User } from '@org/users-domain';

/**
 * Maps Better Auth's `user` table (created by the auth migration) so this context
 * can resolve `User` federation references. Treated as read-only here.
 */
export class UserEntity implements User {
  id!: string;
  email!: string;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const UserEntitySchema = defineEntity({
  class: UserEntity,
  className: 'UserEntity',
  tableName: 'user',
  properties: {
    id: p.string().primary(),
    email: p.string().unique(),
    name: p.string(),
    createdAt: p.datetime().fieldName('created_at'),
    updatedAt: p.datetime().fieldName('updated_at'),
  },
});
