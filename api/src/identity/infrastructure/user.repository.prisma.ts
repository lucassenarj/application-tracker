import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';

type PersistedUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  authProvider: string;
  name: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        authProvider: user.authProvider,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        authProvider: user.authProvider,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }
}

function toUser(row: PersistedUser): User {
  return User.reconstitute({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash ?? undefined,
    authProvider: row.authProvider as User['authProvider'],
    name: row.name ?? undefined,
    avatar: row.avatar ?? undefined,
    role: row.role as User['role'],
    isActive: row.isActive,
    createdAt: row.createdAt,
  });
}
