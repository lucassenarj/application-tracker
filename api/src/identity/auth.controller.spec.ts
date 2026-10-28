import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService, REFRESH_TOKEN_TTL_MS } from './auth.service';
import { FakePasswordHasher } from './test-utils/fakes/password-hasher.fake';
import { FakeRefreshTokenRepository } from './test-utils/fakes/refresh-token.repository.fake';
import { FakeUserRepository } from './test-utils/fakes/user.repository.fake';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(
      new FakeUserRepository(),
      new FakePasswordHasher(),
      new FakeRefreshTokenRepository(),
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
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
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
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
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
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
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
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
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
      await authService.register({
        email: 'jane@example.com',
        password: 'plain-text-password',
        name: 'Jane Doe',
      });
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
});
