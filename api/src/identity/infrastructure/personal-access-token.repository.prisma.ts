import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PersonalAccessToken } from '../domain/personal-access-token';
import type { PersonalAccessTokenRepository } from '../domain/personal-access-token.repository';

type PersistedPersonalAccessToken = {
  id: string;
  userId: string;
  tokenHash: string;
  label: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class PrismaPersonalAccessTokenRepository implements PersonalAccessTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(personalAccessToken: PersonalAccessToken): Promise<void> {
    await this.prisma.personalAccessToken.upsert({
      where: { id: personalAccessToken.id },
      update: {
        lastUsedAt: personalAccessToken.lastUsedAt,
        revokedAt: personalAccessToken.revokedAt,
      },
      create: {
        id: personalAccessToken.id,
        userId: personalAccessToken.userId,
        tokenHash: personalAccessToken.tokenHash,
        label: personalAccessToken.label,
        expiresAt: personalAccessToken.expiresAt,
        lastUsedAt: personalAccessToken.lastUsedAt,
        revokedAt: personalAccessToken.revokedAt,
        createdAt: personalAccessToken.createdAt,
      },
    });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PersonalAccessToken | null> {
    const row = await this.prisma.personalAccessToken.findUnique({
      where: { tokenHash },
    });
    return row ? toPersonalAccessToken(row) : null;
  }

  async findAllByUserId(userId: string): Promise<PersonalAccessToken[]> {
    const rows = await this.prisma.personalAccessToken.findMany({
      where: { userId },
    });
    return rows.map(toPersonalAccessToken);
  }

  async findById(id: string): Promise<PersonalAccessToken | null> {
    const row = await this.prisma.personalAccessToken.findUnique({
      where: { id },
    });
    return row ? toPersonalAccessToken(row) : null;
  }
}

function toPersonalAccessToken(
  row: PersistedPersonalAccessToken,
): PersonalAccessToken {
  return PersonalAccessToken.reconstitute({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    label: row.label,
    expiresAt: row.expiresAt ?? undefined,
    lastUsedAt: row.lastUsedAt ?? undefined,
    revokedAt: row.revokedAt ?? undefined,
    createdAt: row.createdAt,
  });
}
