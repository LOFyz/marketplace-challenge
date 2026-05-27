import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { User, UserRepository } from '@org/users-domain';
import { UserEntitySchema } from '../entities/user.entity.js';

@Injectable()
export class MikroUserRepository implements UserRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    return this.em.findOne(UserEntitySchema, { id });
  }
}
