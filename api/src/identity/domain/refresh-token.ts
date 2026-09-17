import { randomUUID } from 'crypto';

export interface CreateRefreshTokenProps {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

export class RefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly familyId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt?: Date;

  private constructor(props: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.familyId = props.familyId;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.revokedAt = props.revokedAt;
  }

  static create(input: CreateRefreshTokenProps): RefreshToken {
    if (!input.userId) {
      throw new Error('userId is required');
    }

    if (!input.tokenHash) {
      throw new Error('tokenHash is required');
    }

    if (!input.familyId) {
      throw new Error('familyId is required');
    }

    if (!input.expiresAt) {
      throw new Error('expiresAt is required');
    }

    return new RefreshToken({
      id: randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      familyId: input.familyId,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date;
  }): RefreshToken {
    return new RefreshToken(props);
  }
}
