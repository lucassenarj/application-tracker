import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshToken } from '../domain/refresh-token';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository';

type PersistedRefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  rememberMe: boolean;
};

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(refreshToken: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.upsert({
      where: { id: refreshToken.id },
      update: {
        revokedAt: refreshToken.revokedAt,
      },
      create: {
        id: refreshToken.id,
        userId: refreshToken.userId,
        tokenHash: refreshToken.tokenHash,
        familyId: refreshToken.familyId,
        expiresAt: refreshToken.expiresAt,
        createdAt: refreshToken.createdAt,
        revokedAt: refreshToken.revokedAt,
        rememberMe: refreshToken.rememberMe,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return row ? toRefreshToken(row) : null;
  }

  async findAllByFamilyId(familyId: string): Promise<RefreshToken[]> {
    const rows = await this.prisma.refreshToken.findMany({
      where: { familyId },
    });
    return rows.map(toRefreshToken);
  }

  async findAllByUserId(userId: string): Promise<RefreshToken[]> {
    const rows = await this.prisma.refreshToken.findMany({
      where: { userId },
    });
    return rows.map(toRefreshToken);
  }
}

function toRefreshToken(row: PersistedRefreshToken): RefreshToken {
  return RefreshToken.reconstitute({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    familyId: row.familyId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt ?? undefined,
    rememberMe: row.rememberMe,
  });
}
