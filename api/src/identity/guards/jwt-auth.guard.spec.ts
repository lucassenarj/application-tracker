import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    jwtAuthGuard = new JwtAuthGuard(jwtService);
  });

  describe('canActivate', () => {
    it('allows the request and attaches the user id when the access token is valid', () => {
      const accessToken = jwtService.sign({ sub: 'user-1' });
      const mockRequest = { cookies: { accessToken } } as unknown as Request;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      const result = jwtAuthGuard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({ id: 'user-1' });
    });
    it('throws an UnauthorizedException when no access token is present', () => {
      const mockRequest = { cookies: {} } as unknown as Request;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      expect(() => jwtAuthGuard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
    it('throws an UnauthorizedException when the access token is invalid', () => {
      const mockRequest = {
        cookies: { accessToken: 'invalid-token' },
      } as unknown as Request;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      expect(() => jwtAuthGuard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
