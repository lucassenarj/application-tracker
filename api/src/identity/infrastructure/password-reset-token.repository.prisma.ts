import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordResetToken } from '../domain/password-reset-token';
import type { PasswordResetTokenRepository } from '../domain/password-reset-token.repository';

type PersistedPasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
};

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(passwordResetToken: PasswordResetToken): Promise<void> {
    await this.prisma.passwordResetToken.upsert({
      where: { id: passwordResetToken.id },
      update: {
        usedAt: passwordResetToken.usedAt,
      },
      create: {
        id: passwordResetToken.id,
        userId: passwordResetToken.userId,
        tokenHash: passwordResetToken.tokenHash,
        expiresAt: passwordResetToken.expiresAt,
        createdAt: passwordResetToken.createdAt,
        usedAt: passwordResetToken.usedAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    return row ? toPasswordResetToken(row) : null;
  }
}

function toPasswordResetToken(
  row: PersistedPasswordResetToken,
): PasswordResetToken {
  return PasswordResetToken.reconstitute({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    usedAt: row.usedAt ?? undefined,
  });
}
