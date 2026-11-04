import { randomUUID } from 'crypto';

export interface CreatePasswordResetTokenProps {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class PasswordResetToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly usedAt?: Date;

  private constructor(props: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    usedAt?: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.usedAt = props.usedAt;
  }

  static create(input: CreatePasswordResetTokenProps): PasswordResetToken {
    if (!input.userId) {
      throw new Error('userId is required');
    }

    if (!input.tokenHash) {
      throw new Error('tokenHash is required');
    }

    if (!input.expiresAt) {
      throw new Error('expiresAt is required');
    }

    return new PasswordResetToken({
      id: randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    usedAt?: Date;
  }): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  markUsed(): PasswordResetToken {
    if (this.usedAt) {
      throw new Error('PasswordResetToken has already been used');
    }

    return new PasswordResetToken({
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      usedAt: new Date(),
    });
  }
}
