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
import { PasswordResetToken } from './domain/password-reset-token';
import { EmailVerificationToken } from './domain/email-verification-token';
import type { EmailSender } from './domain/email-sender';
import type { EmailVerificationTokenRepository } from './domain/email-verification-token.repository';
import type { PasswordHasher } from './domain/password-hasher';
import type { PasswordResetTokenRepository } from './domain/password-reset-token.repository';
import type { RefreshTokenRepository } from './domain/refresh-token.repository';
import type { UserRepository } from './domain/user.repository';
import { generateToken, hashToken } from './infrastructure/token-crypto';

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 60 * 60 * 1000;

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
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
    @Inject('PasswordResetTokenRepository')
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    @Inject('EmailVerificationTokenRepository')
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    @Inject('EmailSender')
    private readonly emailSender: EmailSender,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<User> {
    const normalizedEmail = User.normalizeEmail(input.email);
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    const passwordHash = await this.passwordHasher.hash(input.password);
    let user: User;

    if (existingUser) {
      if (existingUser.emailVerifiedAt) {
        throw new ConflictException('a User with this email already exists');
      }

      user = existingUser
        .changePassword(passwordHash)
        .updateProfile({ name: input.name });
    } else {
      user = User.create({
        email: input.email,
        passwordHash,
        name: input.name,
      });
    }

    await this.userRepository.save(user);
    await this.sendVerificationEmail(user);

    return user;
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const rawToken = generateToken();
    const emailVerificationToken = EmailVerificationToken.create({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
    });
    await this.emailVerificationTokenRepository.save(emailVerificationToken);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    await this.emailSender.send({
      to: user.email,
      subject: 'Verify your email',
      body: `Click the link below to verify your email:\n\n${verificationLink}\n\nThis link expires in 1 hour.`,
    });
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

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'please verify your email before logging in',
      );
    }

    const accessToken = this.jwtService.sign({ sub: user.id });

    const rawRefreshToken = generateToken();
    const refreshToken = RefreshToken.create({
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      familyId: randomUUID(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      rememberMe: input.rememberMe,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user,
      rememberMe: input.rememberMe,
    };
  }

  async refresh(rawRefreshToken: string): Promise<RefreshResult> {
    const tokenHash = hashToken(rawRefreshToken);
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

    const newRawRefreshToken = generateToken();
    const newRefreshToken = RefreshToken.create({
      userId: existingRefreshToken.userId,
      tokenHash: hashToken(newRawRefreshToken),
      familyId: existingRefreshToken.familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      rememberMe: existingRefreshToken.rememberMe,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      rememberMe: existingRefreshToken.rememberMe,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
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

  async changePassword(
    userId: string,
    input: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions: boolean;
      currentRawRefreshToken?: string;
    },
  ): Promise<void> {
    const user = await this.getProfile(userId);

    if (!user.passwordHash) {
      throw new UnauthorizedException('invalid credentials');
    }

    const isCurrentPasswordValid = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('invalid credentials');
    }

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    const updatedUser = user.changePassword(newPasswordHash);
    await this.userRepository.save(updatedUser);

    if (input.revokeOtherSessions) {
      await this.revokeOtherSessions(userId, input.currentRawRefreshToken);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = User.normalizeEmail(email);
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || !user.emailVerifiedAt) {
      return;
    }

    const rawToken = generateToken();
    const passwordResetToken = PasswordResetToken.create({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    });
    await this.passwordResetTokenRepository.save(passwordResetToken);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await this.emailSender.send({
      to: user.email,
      subject: 'Reset your password',
      body: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour.`,
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const passwordResetToken =
      await this.passwordResetTokenRepository.findByTokenHash(
        hashToken(rawToken),
      );

    if (
      !passwordResetToken ||
      passwordResetToken.usedAt ||
      passwordResetToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('invalid or expired reset token');
    }

    const user = await this.userRepository.findById(passwordResetToken.userId);

    if (!user) {
      throw new UnauthorizedException('invalid or expired reset token');
    }

    await this.passwordResetTokenRepository.save(passwordResetToken.markUsed());

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    const updatedUser = user.changePassword(newPasswordHash);
    await this.userRepository.save(updatedUser);

    await this.revokeOtherSessions(user.id);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findByTokenHash(
        hashToken(rawToken),
      );

    if (
      !emailVerificationToken ||
      emailVerificationToken.usedAt ||
      emailVerificationToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('invalid or expired verification token');
    }

    const user = await this.userRepository.findById(
      emailVerificationToken.userId,
    );

    if (!user) {
      throw new UnauthorizedException('invalid or expired verification token');
    }

    await this.emailVerificationTokenRepository.save(
      emailVerificationToken.markUsed(),
    );

    const verifiedUser = user.verifyEmail();
    await this.userRepository.save(verifiedUser);
  }

  private async revokeOtherSessions(
    userId: string,
    currentRawRefreshToken?: string,
  ): Promise<void> {
    const currentRefreshToken = currentRawRefreshToken
      ? await this.refreshTokenRepository.findByTokenHash(
          hashToken(currentRawRefreshToken),
        )
      : null;
    const currentFamilyId = currentRefreshToken?.familyId;

    const allRefreshTokens =
      await this.refreshTokenRepository.findAllByUserId(userId);

    await Promise.all(
      allRefreshTokens
        .filter(
          (refreshToken) =>
            !refreshToken.revokedAt &&
            refreshToken.familyId !== currentFamilyId,
        )
        .map((refreshToken) =>
          this.refreshTokenRepository.save(refreshToken.revoke()),
        ),
    );
  }
}
