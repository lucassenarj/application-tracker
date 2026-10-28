import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { User } from './domain/user';
import { RefreshToken } from './domain/refresh-token';
import { hashRefreshToken } from './infrastructure/refresh-token-crypto';
import { FakePasswordHasher } from './test-utils/fakes/password-hasher.fake';
import { FakeRefreshTokenRepository } from './test-utils/fakes/refresh-token.repository.fake';
import { FakeUserRepository } from './test-utils/fakes/user.repository.fake';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let refreshTokenRepository: FakeRefreshTokenRepository;
  let jwtService: JwtService;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    refreshTokenRepository = new FakeRefreshTokenRepository();
    jwtService = new JwtService({ secret: 'test-secret' });
    authService = new AuthService(
      userRepository,
      passwordHasher,
      refreshTokenRepository,
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

    it('throws an error when a User with the given email already exists', async () => {
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
      ).rejects.toThrow(ConflictException);
    });
    it('throws an error when a User with the given email already exists in a different case', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      await expect(
        authService.register({
          email: 'JANE@EXAMPLE.COM',
          password: 'another-password',
          name: 'Jane Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns an access token and a refresh token for valid credentials', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
      });

      expect(loginResult.accessToken).toEqual(expect.any(String));
      expect(loginResult.accessToken).not.toBe('');
      expect(loginResult.refreshToken).toEqual(expect.any(String));
      expect(loginResult.refreshToken).not.toBe('');
    });
    it('throws an error when no User exists for the given email', async () => {
      await expect(
        authService.login({
          email: 'jane@example.com',
          password: 'plain-text-password',
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
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('creates a new refresh token family on each login', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const firstLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
      });
      const secondLoginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
      });

      const firstRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashRefreshToken(firstLoginResult.refreshToken),
      );
      const secondRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashRefreshToken(secondLoginResult.refreshToken),
      );

      expect(firstRefreshToken?.familyId).not.toBe(
        secondRefreshToken?.familyId,
      );
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and issues a new access token', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
      });

      const refreshResult = await authService.refresh(loginResult.refreshToken);

      expect(refreshResult.accessToken).toEqual(expect.any(String));
      expect(refreshResult.accessToken).not.toBe('');
      expect(refreshResult.refreshToken).toEqual(expect.any(String));
      expect(refreshResult.refreshToken).not.toBe('');
      expect(refreshResult.refreshToken).not.toBe(loginResult.refreshToken);
    });
    it('revokes the old refresh token after a successful rotation', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
      });

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await authService.refresh(loginResult.refreshToken);

      const oldRefreshToken = await refreshTokenRepository.findByTokenHash(
        hashRefreshToken(loginResult.refreshToken),
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
        tokenHash: hashRefreshToken(rawRefreshToken),
        familyId: 'family-1',
        expiresAt: new Date(Date.now() - 1000),
      });
      await refreshTokenRepository.save(expiredRefreshToken);

      await expect(authService.refresh(rawRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('revokes the entire token family when an already-revoked refresh token is reused', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
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
        hashRefreshToken(firstRefreshResult.refreshToken),
      );
      expect(rotatedRefreshToken?.revokedAt).toEqual(now);

      jest.useRealTimers();
    });
  });

  describe('logout', () => {
    it('revokes the given refresh token', async () => {
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const loginResult = await authService.login({
        email: 'jane@example.com',
        password: 'plain-text-password',
      });

      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await authService.logout(loginResult.refreshToken);

      const refreshToken = await refreshTokenRepository.findByTokenHash(
        hashRefreshToken(loginResult.refreshToken),
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
});
