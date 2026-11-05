import {
  ConflictException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { User } from './domain/user';
import { RefreshToken } from './domain/refresh-token';
import { hashToken } from './infrastructure/token-crypto';
import { FakeEmailSender } from './test-utils/fakes/email-sender.fake';
import { FakeEmailVerificationTokenRepository } from './test-utils/fakes/email-verification-token.repository.fake';
import { FakePasswordHasher } from './test-utils/fakes/password-hasher.fake';
import { FakePasswordResetTokenRepository } from './test-utils/fakes/password-reset-token.repository.fake';
import { FakeRefreshTokenRepository } from './test-utils/fakes/refresh-token.repository.fake';
import { FakeUserRepository } from './test-utils/fakes/user.repository.fake';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let refreshTokenRepository: FakeRefreshTokenRepository;
  let passwordResetTokenRepository: FakePasswordResetTokenRepository;
  let emailVerificationTokenRepository: FakeEmailVerificationTokenRepository;
  let emailSender: FakeEmailSender;
  let jwtService: JwtService;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    refreshTokenRepository = new FakeRefreshTokenRepository();
    passwordResetTokenRepository = new FakePasswordResetTokenRepository();
    emailVerificationTokenRepository =
      new FakeEmailVerificationTokenRepository();
    emailSender = new FakeEmailSender();
    jwtService = new JwtService({ secret: 'test-secret' });
    authService = new AuthService(
      userRepository,
      passwordHasher,
      refreshTokenRepository,
      passwordResetTokenRepository,
      emailVerificationTokenRepository,
      emailSender,
      jwtService,
    );
  });

  describe('register', () => {
    it('creates a User with a hashed password and persists it', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      expect(newUser.email).toBe('jane@example.com');
      expect(newUser.passwordHash).toBe('hashed:plain-text-password');

      const savedUser = await userRepository.findByEmail('jane@example.com');
      expect(savedUser?.id).toBe(newUser.id);
    });

    it('creates a User with the given name', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      expect(newUser.name).toBe('Jane Doe');
    });

    it('throws an error when a User with the given email already exists and has verified their email', async () => {
      const existingUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(existingUser.verifyEmail());

      await expect(
        authService.register({
          email: 'jane@example.com',
          password: 'another-password',
          name: 'Jane Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });
    it('throws an error when a User with the given email already exists in a different case and has verified their email', async () => {
      const existingUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(existingUser.verifyEmail());

      await expect(
        authService.register({
          email: 'JANE@EXAMPLE.COM',
          password: 'another-password',
          name: 'Jane Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('does not set emailVerifiedAt on a newly created User', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      expect(newUser.emailVerifiedAt).toBeUndefined();
    });

    it('sends a verification email containing a token link after registering a new User', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      expect(emailSender.sentEmails).toHaveLength(1);
      expect(emailSender.sentEmails[0].to).toBe('jane@example.com');
      expect(emailSender.sentEmails[0].body).toMatch(/\/verify-email\?token=/);
    });

    it('does not throw when the email fails to send', async () => {
      emailSender.failNextSend = true;

      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
    });

    it('logs the error when the email fails to send', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      emailSender.failNextSend = true;

      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('does not throw when a User with the given email already exists but has not verified their email yet', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      await expect(
        authService.register({
          email: 'jane@example.com',
          password: 'another-password',
          name: 'Jane Doe',
        }),
      ).resolves.not.toThrow();
    });

    it("updates the existing unverified User's password and name when registering again with the same email", async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const updatedUser = await authService.register({
        email: 'jane@example.com',
        password: 'another-password',
        name: 'Jane Smith',
      });

      expect(updatedUser.name).toBe('Jane Smith');
      expect(updatedUser.passwordHash).toBe('hashed:another-password');
    });

    it('sends a new verification email when registering again with an existing, unverified email', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      await authService.register({
        email: 'jane@example.com',
        password: 'another-password',
        name: 'Jane Doe',
      });

      expect(emailSender.sentEmails).toHaveLength(2);
    });

    it('does not create a duplicate User when registering again with an existing, unverified email', async () => {
      const firstUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const secondUser = await authService.register({
        email: 'jane@example.com',
        password: 'another-password',
        name: 'Jane Doe',
      });

      expect(secondUser.id).toBe(firstUser.id);
    });
  });

  describe('login', () => {
    it('throws an UnauthorizedException when the User has not verified their email yet', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'plain-text-password',
          rememberMe: true,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token and a refresh token for valid credentials', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());

      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      expect(loginResult.accessToken).toEqual(expect.any(String));
      expect(loginResult.accessToken).not.toBe('');
      expect(loginResult.refreshToken).toEqual(expect.any(String));
      expect(loginResult.refreshToken).not.toBe('');
    });
    it('includes rememberMe in the result, matching the input', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());

      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      expect(loginResult.rememberMe).toBe(true);
    });
    it('throws an error when no User exists for the given email', async () => {
      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'plain-text-password',
          rememberMe: true,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('throws an error when the password does not match', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'wrong-password',
          rememberMe: true,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('creates a new refresh token family on each login', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());

      const firstLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });
      const secondLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      const firstRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(firstLoginResult.refreshToken),
      );
      const secondRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(secondLoginResult.refreshToken),
      );

      expect(firstRefreshToken?.familyId).not.toBe(
        secondRefreshToken?.familyId,
      );
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and issues a new access token', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      const refreshResult = await authService.refresh(loginResult.refreshToken);

      expect(refreshResult.accessToken).toEqual(expect.any(String));
      expect(refreshResult.accessToken).not.toBe('');
      expect(refreshResult.refreshToken).toEqual(expect.any(String));
      expect(refreshResult.refreshToken).not.toBe('');
      expect(refreshResult.refreshToken).not.toBe(loginResult.refreshToken);
    });
    it('revokes the old refresh token after a successful rotation', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await authService.refresh(loginResult.refreshToken);

      const oldRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(loginResult.refreshToken),
      );

      expect(oldRefreshToken?.revokedAt).toEqual(now);

      jest.useRealTimers();
    });
    it('throws an error when the refresh token does not exist', async () => {
      await expect(authService.refresh('nonexistent-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('throws an error when the refresh token is expired', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const rawRefreshToken = 'raw-refresh-token';
      const expiredRefreshToken = RefreshToken.create({
        userId: newUser.id,
        tokenHash: hashToken(rawRefreshToken),
        familyId: 'family-1',
        expiresAt: new Date(Date.now() - 1000),
        rememberMe: true,
      });
      await refreshTokenRepository.save(expiredRefreshToken);

      await expect(authService.refresh(rawRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('revokes the entire token family when an already-revoked refresh token is reused', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      const firstRefreshResult = await authService.refresh(
        loginResult.refreshToken,
      );

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await expect(
        authService.refresh(loginResult.refreshToken),
      ).rejects.toThrow(UnauthorizedException);

      const rotatedRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(firstRefreshResult.refreshToken),
      );
      expect(rotatedRefreshToken?.revokedAt).toEqual(now);

      jest.useRealTimers();
    });
  });

  describe('logout', () => {
    it('revokes the given refresh token', async () => {
      const newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await authService.logout(loginResult.refreshToken);

      const refreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(loginResult.refreshToken),
      );

      expect(refreshToken?.revokedAt).toEqual(now);

      jest.useRealTimers();
    });
    it('does not throw when the refresh token does not exist', async () => {
      await authService.logout('nonexistent-token');
    });
  });

  describe('getProfile', () => {
    let newUser: User;

    beforeEach(async () => {
      newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
    });

    it('returns the User matching the given id', async () => {
      const profile = await authService.getProfile(newUser.id);

      expect(profile.id).toBe(newUser.id);
      expect(profile.email).toBe('jane@example.com');
    });

    it('throws a NotFoundException when no User matches the given id', async () => {
      await expect(authService.getProfile('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    let newUser: User;

    beforeEach(async () => {
      newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
    });

    it("updates the User's name and persists it", async () => {
      const updatedUser = await authService.updateProfile(newUser.id, {
        name: 'Jane Doe',
      });

      expect(updatedUser.name).toBe('Jane Doe');

      const persistedUser = await userRepository.findById(newUser.id);
      expect(persistedUser?.name).toBe('Jane Doe');
    });

    it("updates the User's avatar and persists it", async () => {
      const updatedUser = await authService.updateProfile(newUser.id, {
        avatar: 'https://example.com/avatar.png',
      });

      expect(updatedUser.avatar).toBe('https://example.com/avatar.png');
    });

    it('throws a NotFoundException when no User matches the given id', async () => {
      await expect(
        authService.updateProfile('nonexistent-id', { name: 'Jane Doe' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    let newUser: User;

    beforeEach(async () => {
      newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
    });

    it('hashes and persists the new password when the current password is correct', async () => {
      await authService.changePassword(newUser.id, {
        currentPassword: 'plain-text-password',
        newPassword: 'new-plain-text-password',
        revokeOtherSessions: false,
      });

      const persistedUser = await userRepository.findById(newUser.id);
      expect(persistedUser?.passwordHash).toBe(
        'hashed:new-plain-text-password',
      );
    });

    it('throws an UnauthorizedException when the current password is incorrect', async () => {
      await expect(
        authService.changePassword(newUser.id, {
          currentPassword: 'wrong-password',
          newPassword: 'new-plain-text-password',
          revokeOtherSessions: false,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws a NotFoundException when no User matches the given id', async () => {
      await expect(
        authService.changePassword('nonexistent-id', {
          currentPassword: 'plain-text-password',
          newPassword: 'new-plain-text-password',
          revokeOtherSessions: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("revokes every other session's refresh tokens when revokeOtherSessions is true, but keeps the current session active", async () => {
      const currentLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });
      const otherLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      await authService.changePassword(newUser.id, {
        currentPassword: 'plain-text-password',
        newPassword: 'new-plain-text-password',
        revokeOtherSessions: true,
        currentRawRefreshToken: currentLoginResult.refreshToken,
      });

      const currentRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(currentLoginResult.refreshToken),
      );
      const otherRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(otherLoginResult.refreshToken),
      );

      expect(currentRefreshToken?.revokedAt).toBeUndefined();
      expect(otherRefreshToken?.revokedAt).toBeInstanceOf(Date);
    });

    it('does not revoke any other sessions when revokeOtherSessions is false', async () => {
      const currentLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });
      const otherLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      await authService.changePassword(newUser.id, {
        currentPassword: 'plain-text-password',
        newPassword: 'new-plain-text-password',
        revokeOtherSessions: false,
        currentRawRefreshToken: currentLoginResult.refreshToken,
      });

      const otherRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(otherLoginResult.refreshToken),
      );

      expect(otherRefreshToken?.revokedAt).toBeUndefined();
    });
  });

  describe('requestPasswordReset', () => {
    let newUser: User;

    beforeEach(async () => {
      newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
      emailSender.sentEmails.length = 0;
    });

    it('creates a PasswordResetToken for the User matching the given email', async () => {
      await authService.requestPasswordReset('jane@example.com');

      const sentEmail = emailSender.sentEmails[0];
      const rawToken = new URL(
        sentEmail.body.match(/https?:\/\/\S+/)![0],
      ).searchParams.get('token')!;

      const passwordResetToken =
        await passwordResetTokenRepository.findByTokenHash(hashToken(rawToken));

      expect(passwordResetToken?.userId).toBe(newUser.id);
    });

    it('sends an email containing the reset link with the raw token', async () => {
      await authService.requestPasswordReset('jane@example.com');

      expect(emailSender.sentEmails).toHaveLength(1);
      expect(emailSender.sentEmails[0].to).toBe('jane@example.com');
      expect(emailSender.sentEmails[0].body).toMatch(
        /\/reset-password\?token=/,
      );
    });

    it('sets the token to expire in 1 hour', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await authService.requestPasswordReset('jane@example.com');

      const sentEmail = emailSender.sentEmails[0];
      const rawToken = new URL(
        sentEmail.body.match(/https?:\/\/\S+/)![0],
      ).searchParams.get('token')!;
      const passwordResetToken =
        await passwordResetTokenRepository.findByTokenHash(hashToken(rawToken));

      expect(passwordResetToken?.expiresAt).toEqual(
        new Date(now.getTime() + 60 * 60 * 1000),
      );

      jest.useRealTimers();
    });

    it('does not throw when no User matches the given email', async () => {
      await authService.requestPasswordReset('nonexistent@example.com');
    });

    it('does not create a PasswordResetToken or send an email when no User matches the given email', async () => {
      await authService.requestPasswordReset('nonexistent@example.com');

      expect(emailSender.sentEmails).toHaveLength(0);
    });

    it('does not create a PasswordResetToken or send an email when the User has not verified their email yet', async () => {
      await userRepository.save(newUser);

      await authService.requestPasswordReset('jane@example.com');

      expect(emailSender.sentEmails).toHaveLength(0);
    });

    it('does not throw when the email fails to send', async () => {
      emailSender.failNextSend = true;

      await authService.requestPasswordReset('jane@example.com');
    });
  });

  describe('resetPassword', () => {
    let newUser: User;
    let rawToken: string;

    beforeEach(async () => {
      newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      await userRepository.save(newUser.verifyEmail());
      emailSender.sentEmails.length = 0;
      await authService.requestPasswordReset('jane@example.com');

      const sentEmail = emailSender.sentEmails[0];
      rawToken = new URL(
        sentEmail.body.match(/https?:\/\/\S+/)![0],
      ).searchParams.get('token')!;
    });

    it('hashes and persists the new password when the token is valid', async () => {
      await authService.resetPassword(rawToken, 'new-plain-text-password');

      const persistedUser = await userRepository.findById(newUser.id);
      expect(persistedUser?.passwordHash).toBe(
        'hashed:new-plain-text-password',
      );
    });

    it('marks the token as used after a successful reset', async () => {
      await authService.resetPassword(rawToken, 'new-plain-text-password');

      const passwordResetToken =
        await passwordResetTokenRepository.findByTokenHash(hashToken(rawToken));

      expect(passwordResetToken?.usedAt).toBeInstanceOf(Date);
    });

    it("revokes every one of the User's active sessions after a successful reset", async () => {
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
        rememberMe: true,
      });

      await authService.resetPassword(rawToken, 'new-plain-text-password');

      const activeRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashToken(loginResult.refreshToken),
      );

      expect(activeRefreshToken?.revokedAt).toBeInstanceOf(Date);
    });

    it('throws an UnauthorizedException when the token does not exist', async () => {
      await expect(
        authService.resetPassword(
          'nonexistent-token',
          'new-plain-text-password',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an UnauthorizedException when the token has expired', async () => {
      const now = new Date();
      jest
        .useFakeTimers()
        .setSystemTime(new Date(now.getTime() + 61 * 60 * 1000));

      await expect(
        authService.resetPassword(rawToken, 'new-plain-text-password'),
      ).rejects.toThrow(UnauthorizedException);

      jest.useRealTimers();
    });

    it('throws an UnauthorizedException when the token has already been used', async () => {
      await authService.resetPassword(rawToken, 'new-plain-text-password');

      await expect(
        authService.resetPassword(rawToken, 'another-new-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    let newUser: User;
    let rawToken: string;

    beforeEach(async () => {
      newUser = await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const sentEmail = emailSender.sentEmails[0];
      rawToken = new URL(
        sentEmail.body.match(/https?:\/\/\S+/)![0],
      ).searchParams.get('token')!;
    });

    it("marks the User's email as verified when the token is valid", async () => {
      await authService.verifyEmail(rawToken);

      const persistedUser = await userRepository.findById(newUser.id);
      expect(persistedUser?.emailVerifiedAt).toBeInstanceOf(Date);
    });

    it('marks the token as used after a successful verification', async () => {
      await authService.verifyEmail(rawToken);

      const emailVerificationToken =
        await emailVerificationTokenRepository.findByTokenHash(
          hashToken(rawToken),
        );

      expect(emailVerificationToken?.usedAt).toBeInstanceOf(Date);
    });

    it('throws an UnauthorizedException when the token does not exist', async () => {
      await expect(
        authService.verifyEmail('nonexistent-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an UnauthorizedException when the token has expired', async () => {
      const now = new Date();
      jest
        .useFakeTimers()
        .setSystemTime(new Date(now.getTime() + 61 * 60 * 1000));

      await expect(authService.verifyEmail(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      jest.useRealTimers();
    });

    it('throws an UnauthorizedException when the token has already been used', async () => {
      await authService.verifyEmail(rawToken);

      await expect(authService.verifyEmail(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
