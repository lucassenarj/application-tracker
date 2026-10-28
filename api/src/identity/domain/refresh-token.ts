import { randomUUID } from 'crypto';

export interface CreateRefreshTokenProps {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  rememberMe: boolean;
}

export class RefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly familyId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt?: Date;
  readonly rememberMe: boolean;

  private constructor(props: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date;
    rememberMe: boolean;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.familyId = props.familyId;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.revokedAt = props.revokedAt;
    this.rememberMe = props.rememberMe;
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
      rememberMe: input.rememberMe,
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
    rememberMe: boolean;
  }): RefreshToken {
    return new RefreshToken(props);
  }

  revoke(): RefreshToken {
    if (this.revokedAt) {
      throw new Error('RefreshToken is already revoked');
    }

    return new RefreshToken({
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      familyId: this.familyId,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      revokedAt: new Date(),
      rememberMe: this.rememberMe,
    });
  }
}
