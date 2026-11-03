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
  phone: string | null;
  bio: string | null;
  language: string | null;
  defaultCurrency: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  emailVerifiedAt: Date | null;
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
        phone: user.phone,
        bio: user.bio,
        language: user.language,
        defaultCurrency: user.defaultCurrency,
        role: user.role,
        isActive: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        authProvider: user.authProvider,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        language: user.language,
        defaultCurrency: user.defaultCurrency,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
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
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    language: row.language ?? undefined,
    defaultCurrency: row.defaultCurrency ?? undefined,
    role: row.role as User['role'],
    isActive: row.isActive,
    createdAt: row.createdAt,
    emailVerifiedAt: row.emailVerifiedAt ?? undefined,
  });
}
