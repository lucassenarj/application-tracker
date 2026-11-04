import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailVerificationToken } from '../domain/email-verification-token';
import type { EmailVerificationTokenRepository } from '../domain/email-verification-token.repository';

type PersistedEmailVerificationToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
};

@Injectable()
export class PrismaEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(emailVerificationToken: EmailVerificationToken): Promise<void> {
    await this.prisma.emailVerificationToken.upsert({
      where: { id: emailVerificationToken.id },
      update: {
        usedAt: emailVerificationToken.usedAt,
      },
      create: {
        id: emailVerificationToken.id,
        userId: emailVerificationToken.userId,
        tokenHash: emailVerificationToken.tokenHash,
        expiresAt: emailVerificationToken.expiresAt,
        createdAt: emailVerificationToken.createdAt,
        usedAt: emailVerificationToken.usedAt,
      },
    });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    const row = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    return row ? toEmailVerificationToken(row) : null;
  }
}

function toEmailVerificationToken(
  row: PersistedEmailVerificationToken,
): EmailVerificationToken {
  return EmailVerificationToken.reconstitute({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    usedAt: row.usedAt ?? undefined,
  });
}
