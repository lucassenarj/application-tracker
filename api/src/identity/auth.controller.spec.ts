import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService, REFRESH_TOKEN_TTL_MS } from './auth.service';
import type { UserResponse } from './dto/user-response.dto';
import { FakeEmailSender } from './test-utils/fakes/email-sender.fake';
import { FakeEmailVerificationTokenRepository } from './test-utils/fakes/email-verification-token.repository.fake';
import { FakePasswordHasher } from './test-utils/fakes/password-hasher.fake';
import { FakePersonalAccessTokenRepository } from './test-utils/fakes/personal-access-token.repository.fake';
import { FakePasswordResetTokenRepository } from './test-utils/fakes/password-reset-token.repository.fake';
import { FakeRefreshTokenRepository } from './test-utils/fakes/refresh-token.repository.fake';
import { FakeUserRepository } from './test-utils/fakes/user.repository.fake';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userRepository: FakeUserRepository;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    authService = new AuthService(
      userRepository,
      new FakePasswordHasher(),
      new FakeRefreshTokenRepository(),
      new FakePasswordResetTokenRepository(),
      new FakeEmailVerificationTokenRepository(),
      new FakePersonalAccessTokenRepository(),
      new FakeEmailSender(),
      new JwtService({ secret: 'test-secret' }),
    );
    authController = new AuthController(authService);
  });

  describe('register', () => {
    it('creates a User and returns it without the password hash', async () => {
      const userResponse = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      expect(userResponse.email).toBe('jane@example.com');

      const serializedUserResponse = instanceToPlain(userResponse);
      expect(serializedUserResponse.passwordHash).toBeUndefined();
    });
  });

  describe('login', () => {
    it('returns the authenticated User without the password hash', async () => {
      await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const newUser = await userRepository.findByEmail('jane@example.com');
      await userRepository.save(newUser!.verifyEmail());

      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      const userResponse = await authController.login(
        { email: 'jane@example.com', password: 'plain-text-password' },
        mockResponse,
      );

      expect(userResponse.email).toBe('jane@example.com');

      const serializedUserResponse = instanceToPlain(userResponse);
      expect(serializedUserResponse.passwordHash).toBeUndefined();
    });

    it('sets an httpOnly cookie for the access token', async () => {
      await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const newUser = await userRepository.findByEmail('jane@example.com');
      await userRepository.save(newUser!.verifyEmail());

      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await authController.login(
        { email: 'jane@example.com', password: 'plain-text-password' },
        mockResponse,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('sets an httpOnly cookie for the refresh token', async () => {
      await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const newUser = await userRepository.findByEmail('jane@example.com');
      await userRepository.save(newUser!.verifyEmail());

      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await authController.login(
        { email: 'jane@example.com', password: 'plain-text-password' },
        mockResponse,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('sets a persistent refresh token cookie when rememberMe is true', async () => {
      await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const newUser = await userRepository.findByEmail('jane@example.com');
      await userRepository.save(newUser!.verifyEmail());

      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await authController.login(
        {
          email: 'jane@example.com',
          password: 'plain-text-password',
          rememberMe: true,
        },
        mockResponse,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ maxAge: REFRESH_TOKEN_TTL_MS }),
      );
    });

    it('sets a session-only refresh token cookie when rememberMe is false or omitted', async () => {
      await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const newUser = await userRepository.findByEmail('jane@example.com');
      await userRepository.save(newUser!.verifyEmail());

      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await authController.login(
        { email: 'jane@example.com', password: 'plain-text-password' },
        mockResponse,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.not.objectContaining({ maxAge: REFRESH_TOKEN_TTL_MS }),
      );
    });
  });

  describe('refresh', () => {
    it('reads the refresh token from the request cookie', async () => {
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

      const mockRequest = {
        cookies: { refreshToken: loginResult.refreshToken },
      } as unknown as Request;
      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await authController.refresh(mockRequest, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalled();
    });
    it('sets new httpOnly cookies for the rotated access and refresh tokens', async () => {
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

      const mockRequest = {
        cookies: { refreshToken: loginResult.refreshToken },
      } as unknown as Request;
      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await authController.refresh(mockRequest, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('throws an UnauthorizedException when no refresh token cookie is present', async () => {
      const mockRequest = { cookies: {} } as unknown as Request;
      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      await expect(
        authController.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('reads the refresh token from the request cookie', async () => {
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

      const mockRequest = {
        cookies: { refreshToken: loginResult.refreshToken },
      } as unknown as Request;
      const mockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      await authController.logout(mockRequest, mockResponse);

      await expect(
        authService.refresh(loginResult.refreshToken),
      ).rejects.toThrow();
    });

    it('clears the access and refresh token cookies', async () => {
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

      const mockRequest = {
        cookies: { refreshToken: loginResult.refreshToken },
      } as unknown as Request;
      const mockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      await authController.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/auth/refresh' }),
      );
    });

    it('clears the CSRF token cookie', async () => {
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

      const mockRequest = {
        cookies: { refreshToken: loginResult.refreshToken },
      } as unknown as Request;
      const mockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      await authController.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrfToken');
    });

    it('does not call authService.logout when no refresh token cookie is present', async () => {
      const mockRequest = { cookies: {} } as unknown as Request;
      const mockResponse = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as unknown as Response;

      await authController.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('csrfToken', () => {
    it('returns a CSRF token', () => {
      const mockRequest = {
        cookies: { refreshToken: 'some-refresh-token' },
      } as unknown as Request;
      const mockResponse = { cookie: jest.fn() } as unknown as Response;

      const result = authController.getCsrfToken(mockRequest, mockResponse);

      expect(result.csrfToken).toEqual(expect.any(String));
      expect(result.csrfToken).not.toBe('');
    });
  });

  describe('getMe', () => {
    it("returns the authenticated User's profile without the password hash", async () => {
      const newUser = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const mockRequest = {
        user: { id: newUser.id },
      } as unknown as Request;

      const userResponse = await authController.getMe(mockRequest);

      expect(userResponse.email).toBe('jane@example.com');

      const serializedUserResponse = instanceToPlain(userResponse);
      expect(serializedUserResponse.passwordHash).toBeUndefined();
    });
  });

  describe('updateMe', () => {
    it("updates and returns the authenticated User's profile without the password hash", async () => {
      const newUser = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });

      const mockRequest = {
        user: { id: newUser.id },
      } as unknown as Request;

      const userResponse = await authController.updateMe(
        { name: 'Jane Doe' },
        mockRequest,
      );

      expect(userResponse.name).toBe('Jane Doe');

      const serializedUserResponse = instanceToPlain(userResponse);
      expect(serializedUserResponse.passwordHash).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    let newUser: UserResponse;
    let changePasswordSpy: jest.SpyInstance;

    beforeEach(async () => {
      newUser = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      changePasswordSpy = jest.spyOn(authService, 'changePassword');
    });

    it('calls authService.changePassword with currentPassword and newPassword from the request body', async () => {
      const mockRequest = {
        user: { id: newUser.id },
        cookies: {},
      } as unknown as Request;

      await authController.changePassword(
        {
          currentPassword: 'plain-text-password',
          newPassword: 'new-plain-text-password',
          revokeOtherSessions: false,
        },
        mockRequest,
      );

      expect(changePasswordSpy).toHaveBeenCalledWith(
        newUser.id,
        expect.objectContaining({
          currentPassword: 'plain-text-password',
          newPassword: 'new-plain-text-password',
        }),
      );
    });

    it('passes revokeOtherSessions from the request body', async () => {
      const mockRequest = {
        user: { id: newUser.id },
        cookies: {},
      } as unknown as Request;

      await authController.changePassword(
        {
          currentPassword: 'plain-text-password',
          newPassword: 'new-plain-text-password',
          revokeOtherSessions: true,
        },
        mockRequest,
      );

      expect(changePasswordSpy).toHaveBeenCalledWith(
        newUser.id,
        expect.objectContaining({ revokeOtherSessions: true }),
      );
    });

    it("passes the refresh token cookie as the current session's identifier", async () => {
      const mockRequest = {
        user: { id: newUser.id },
        cookies: { refreshToken: 'raw-refresh-token' },
      } as unknown as Request;

      await authController.changePassword(
        {
          currentPassword: 'plain-text-password',
          newPassword: 'new-plain-text-password',
          revokeOtherSessions: false,
        },
        mockRequest,
      );

      expect(changePasswordSpy).toHaveBeenCalledWith(
        newUser.id,
        expect.objectContaining({
          currentRawRefreshToken: 'raw-refresh-token',
        }),
      );
    });

    it('works when no refresh token cookie is present', async () => {
      const mockRequest = {
        user: { id: newUser.id },
        cookies: {},
      } as unknown as Request;

      await expect(
        authController.changePassword(
          {
            currentPassword: 'plain-text-password',
            newPassword: 'new-plain-text-password',
            revokeOtherSessions: false,
          },
          mockRequest,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('calls authService.requestPasswordReset with the email from the request body', async () => {
      const requestPasswordResetSpy = jest.spyOn(
        authService,
        'requestPasswordReset',
      );

      await authController.forgotPassword({ email: 'jane@example.com' });

      expect(requestPasswordResetSpy).toHaveBeenCalledWith('jane@example.com');
    });
  });

  describe('resetPassword', () => {
    it('calls authService.resetPassword with the token and new password from the request body', async () => {
      const resetPasswordSpy = jest.spyOn(authService, 'resetPassword');

      await authController
        .resetPassword({
          token: 'raw-token',
          newPassword: 'new-plain-text-password',
        })
        .catch(() => undefined);

      expect(resetPasswordSpy).toHaveBeenCalledWith(
        'raw-token',
        'new-plain-text-password',
      );
    });
  });

  describe('verifyEmail', () => {
    it('calls authService.verifyEmail with the token from the request body', async () => {
      const verifyEmailSpy = jest.spyOn(authService, 'verifyEmail');

      await authController
        .verifyEmail({ token: 'raw-token' })
        .catch(() => undefined);

      expect(verifyEmailSpy).toHaveBeenCalledWith('raw-token');
    });
  });

  describe('createPersonalAccessToken', () => {
    let newUser: UserResponse;

    beforeEach(async () => {
      newUser = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
    });

    it('creates a PersonalAccessToken for the authenticated user', async () => {
      const mockRequest = { user: { id: newUser.id } } as unknown as Request;

      const result = await authController.createPersonalAccessToken(
        { label: 'LinkedIn extension' },
        mockRequest,
      );

      expect(result.label).toBe('LinkedIn extension');
    });

    it('converts a provided expiresAt string into a Date before calling authService', async () => {
      const mockRequest = { user: { id: newUser.id } } as unknown as Request;
      const createPersonalAccessTokenSpy = jest.spyOn(
        authService,
        'createPersonalAccessToken',
      );

      await authController.createPersonalAccessToken(
        { label: 'LinkedIn extension', expiresAt: '2026-12-01T00:00:00.000Z' },
        mockRequest,
      );

      expect(createPersonalAccessTokenSpy).toHaveBeenCalledWith(newUser.id, {
        label: 'LinkedIn extension',
        expiresAt: new Date('2026-12-01T00:00:00.000Z'),
      });
    });
  });

  describe('listPersonalAccessTokens', () => {
    it('lists PersonalAccessTokens for the authenticated user', async () => {
      const newUser = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const mockRequest = { user: { id: newUser.id } } as unknown as Request;
      await authController.createPersonalAccessToken(
        { label: 'LinkedIn extension' },
        mockRequest,
      );

      const tokens = await authController.listPersonalAccessTokens(mockRequest);

      expect(tokens).toHaveLength(1);
    });
  });

  describe('revokePersonalAccessToken', () => {
    it('revokes the PersonalAccessToken for the authenticated user', async () => {
      const newUser = await authController.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
      const mockRequest = { user: { id: newUser.id } } as unknown as Request;
      const created = await authController.createPersonalAccessToken(
        { label: 'LinkedIn extension' },
        mockRequest,
      );

      await authController.revokePersonalAccessToken(created.id, mockRequest);

      const tokens = await authController.listPersonalAccessTokens(mockRequest);
      expect(tokens[0].revokedAt).toBeInstanceOf(Date);
    });
  });
});
