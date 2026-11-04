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
  readonly phone?: string;
  readonly bio?: string;
  readonly language?: string;
  readonly defaultCurrency?: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly emailVerifiedAt?: Date;

  private constructor(props: {
    id: string;
    email: string;
    passwordHash?: string;
    authProvider: AuthProvider;
    name?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    language?: string;
    defaultCurrency?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    emailVerifiedAt?: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.authProvider = props.authProvider;
    this.name = props.name;
    this.avatar = props.avatar;
    this.phone = props.phone;
    this.bio = props.bio;
    this.language = props.language;
    this.defaultCurrency = props.defaultCurrency;
    this.role = props.role;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.emailVerifiedAt = props.emailVerifiedAt;
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

  static reconstitute(props: {
    id: string;
    email: string;
    passwordHash?: string;
    authProvider: AuthProvider;
    name?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    language?: string;
    defaultCurrency?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    emailVerifiedAt?: Date;
  }): User {
    return new User(props);
  }

  updateProfile(input: {
    name?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    language?: string;
    defaultCurrency?: string;
  }): User {
    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      authProvider: this.authProvider,
      name: input.name ?? this.name,
      avatar: input.avatar ?? this.avatar,
      phone: input.phone ?? this.phone,
      bio: input.bio ?? this.bio,
      language: input.language ?? this.language,
      defaultCurrency: input.defaultCurrency ?? this.defaultCurrency,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      emailVerifiedAt: this.emailVerifiedAt,
    });
  }

  changePassword(newPasswordHash: string): User {
    if (!newPasswordHash) {
      throw new Error('newPasswordHash is required');
    }

    return new User({
      id: this.id,
      email: this.email,
      passwordHash: newPasswordHash,
      authProvider: this.authProvider,
      name: this.name,
      avatar: this.avatar,
      phone: this.phone,
      bio: this.bio,
      language: this.language,
      defaultCurrency: this.defaultCurrency,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      emailVerifiedAt: this.emailVerifiedAt,
    });
  }

  verifyEmail(): User {
    if (this.emailVerifiedAt) {
      throw new Error('email has already been verified');
    }

    return new User({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      authProvider: this.authProvider,
      name: this.name,
      avatar: this.avatar,
      phone: this.phone,
      bio: this.bio,
      language: this.language,
      defaultCurrency: this.defaultCurrency,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      emailVerifiedAt: new Date(),
    });
  }
}
