import { randomUUID } from 'crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from './domain/user';
import { RefreshToken } from './domain/refresh-token';
import type { PasswordHasher } from './domain/password-hasher';
import type { RefreshTokenRepository } from './domain/refresh-token.repository';
import type { UserRepository } from './domain/user.repository';
import {
  generateRefreshToken,
  hashRefreshToken,
} from './infrastructure/refresh-token-crypto';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult extends RefreshResult {
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('PasswordHasher')
    private readonly passwordHasher: PasswordHasher,
    @Inject('RefreshTokenRepository')
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<User> {
    const normalizedEmail = User.normalizeEmail(input.email);
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('a User with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    await this.userRepository.save(user);

    return user;
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const normalizedEmail = User.normalizeEmail(input.email);
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('invalid credentials');
    }

    const isPasswordValid = await this.passwordHasher.verify(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('invalid credentials');
    }

    const accessToken = this.jwtService.sign({ sub: user.id });

    const rawRefreshToken = generateRefreshToken();
    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: hashRefreshToken(rawRefreshToken),
      familyId: randomUUID(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await this.refreshTokenRepository.save(refreshToken);

    return { accessToken, refreshToken: rawRefreshToken, user };
  }

  async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingRefreshToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingRefreshToken) {
      throw new UnauthorizedException('invalid refresh token');
    }

    if (existingRefreshToken.revokedAt) {
      const familyRefreshTokens =
        await this.refreshTokenRepository.findAllByFamilyId(
          existingRefreshToken.familyId,
        );

      await Promise.all(
        familyRefreshTokens
          .filter((refreshToken) => !refreshToken.revokedAt)
          .map((refreshToken) =>
            this.refreshTokenRepository.save(refreshToken.revoke()),
          ),
      );

      throw new UnauthorizedException(
        'refresh token has been reused; token family revoked',
      );
    }

    if (existingRefreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('refresh token has expired');
    }

    const revokedRefreshToken = existingRefreshToken.revoke();
    await this.refreshTokenRepository.save(revokedRefreshToken);

    const accessToken = this.jwtService.sign({
      sub: existingRefreshToken.userId,
    });

    const newRawRefreshToken = generateRefreshToken();
    const newRefreshToken = RefreshToken.create({
      userId: existingRefreshToken.userId,
      tokenHash: hashRefreshToken(newRawRefreshToken),
      familyId: existingRefreshToken.familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    return { accessToken, refreshToken: newRawRefreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingRefreshToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingRefreshToken || existingRefreshToken.revokedAt) {
      return;
    }

    const revokedRefreshToken = existingRefreshToken.revoke();
    await this.refreshTokenRepository.save(revokedRefreshToken);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    input: {
      name?: string;
      avatar?: string;
      phone?: string;
      bio?: string;
      language?: string;
      defaultCurrency?: string;
    },
  ): Promise<User> {
    const user = await this.getProfile(userId);

    const updatedUser = user.updateProfile(input);
    await this.userRepository.save(updatedUser);

    return updatedUser;
  }
}
