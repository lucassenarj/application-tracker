import { randomUUID } from 'crypto';

export type AuthProvider = 'PASSWORD';

export type UserRole = 'USER' | 'ADMIN';

export interface CreateUserProps {
  email: string;
  passwordHash?: string;
  name?: string;
  avatar?: string;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash?: string;
  readonly authProvider: AuthProvider;
  readonly name?: string;
  readonly avatar?: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    email: string;
    passwordHash?: string;
    authProvider: AuthProvider;
    name?: string;
    avatar?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.authProvider = props.authProvider;
    this.name = props.name;
    this.avatar = props.avatar;
    this.role = props.role;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  static create(input: CreateUserProps): User {
    if (!input.email) {
      throw new Error('email is required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new Error('email format is invalid');
    }

    if (!input.passwordHash) {
      throw new Error('password is required');
    }

    return new User({
      id: randomUUID(),
      email: User.normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      authProvider: 'PASSWORD',
      name: input.name,
      avatar: input.avatar,
      role: 'USER',
      isActive: true,
      createdAt: new Date(),
    });
  }

  static normalizeEmail(email: string): string {
    return email.toLowerCase();
  }
}
