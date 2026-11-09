import { randomUUID } from 'crypto';

export interface CreatePersonalAccessTokenProps {
  userId: string;
  tokenHash: string;
  label: string;
  expiresAt?: Date;
}

export class PersonalAccessToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly label: string;
  readonly expiresAt?: Date;
  readonly lastUsedAt?: Date;
  readonly revokedAt?: Date;
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    tokenHash: string;
    label: string;
    expiresAt?: Date;
    lastUsedAt?: Date;
    revokedAt?: Date;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.label = props.label;
    this.expiresAt = props.expiresAt;
    this.lastUsedAt = props.lastUsedAt;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt;
  }

  static create(input: CreatePersonalAccessTokenProps): PersonalAccessToken {
    if (!input.userId) {
      throw new Error('userId is required');
    }

    if (!input.tokenHash) {
      throw new Error('tokenHash is required');
    }

    if (!input.label) {
      throw new Error('label is required');
    }

    return new PersonalAccessToken({
      id: randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      label: input.label,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    tokenHash: string;
    label: string;
    expiresAt?: Date;
    lastUsedAt?: Date;
    revokedAt?: Date;
    createdAt: Date;
  }): PersonalAccessToken {
    return new PersonalAccessToken(props);
  }

  revoke(): PersonalAccessToken {
    if (this.revokedAt) {
      throw new Error('PersonalAccessToken has already been revoked');
    }

    return new PersonalAccessToken({
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      label: this.label,
      expiresAt: this.expiresAt,
      lastUsedAt: this.lastUsedAt,
      createdAt: this.createdAt,
      revokedAt: new Date(),
    });
  }

  markUsed(): PersonalAccessToken {
    return new PersonalAccessToken({
      id: this.id,
      userId: this.userId,
      tokenHash: this.tokenHash,
      label: this.label,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAt,
      createdAt: this.createdAt,
      lastUsedAt: new Date(),
    });
  }

  isExpired(): boolean {
    return this.expiresAt !== undefined && this.expiresAt < new Date();
  }

  isValid(): boolean {
    return !this.revokedAt && !this.isExpired();
  }
}
