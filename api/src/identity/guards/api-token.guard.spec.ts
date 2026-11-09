import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTokenGuard } from './api-token.guard';
import { PersonalAccessToken } from '../domain/personal-access-token';
import { FakePersonalAccessTokenRepository } from '../test-utils/fakes/personal-access-token.repository.fake';
import { hashToken } from '../infrastructure/token-crypto';
import { daysFromNow } from '../test-utils/dates';

function buildContext(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function authorizedRequest(rawToken: string): Request {
  return {
    headers: { authorization: `Bearer ${rawToken}` },
  } as unknown as Request;
}

describe('ApiTokenGuard', () => {
  let apiTokenGuard: ApiTokenGuard;
  let personalAccessTokenRepository: FakePersonalAccessTokenRepository;

  beforeEach(() => {
    personalAccessTokenRepository = new FakePersonalAccessTokenRepository();
    apiTokenGuard = new ApiTokenGuard(personalAccessTokenRepository);
  });

  describe('canActivate', () => {
    describe('with a valid token', () => {
      let personalAccessToken: PersonalAccessToken;
      let mockRequest: Request;

      beforeEach(async () => {
        personalAccessToken = PersonalAccessToken.create({
          userId: 'user-1',
          tokenHash: hashToken('raw-token'),
          label: 'LinkedIn extension',
        });
        await personalAccessTokenRepository.save(personalAccessToken);
        mockRequest = authorizedRequest('raw-token');
      });

      it('allows the request and attaches the user id', async () => {
        const result = await apiTokenGuard.canActivate(
          buildContext(mockRequest),
        );

        expect(result).toBe(true);
        expect(mockRequest.user).toEqual({ id: 'user-1' });
      });

      it('updates lastUsedAt', async () => {
        await apiTokenGuard.canActivate(buildContext(mockRequest));

        const updatedToken =
          await personalAccessTokenRepository.findByTokenHash(
            personalAccessToken.tokenHash,
          );
        expect(updatedToken?.lastUsedAt).toBeInstanceOf(Date);
      });
    });

    it('throws an UnauthorizedException when no Authorization header is present', async () => {
      const mockRequest = { headers: {} } as unknown as Request;

      await expect(
        apiTokenGuard.canActivate(buildContext(mockRequest)),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an UnauthorizedException when the token does not match any PersonalAccessToken', async () => {
      await expect(
        apiTokenGuard.canActivate(
          buildContext(authorizedRequest('unknown-token')),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an UnauthorizedException when the token has been revoked', async () => {
      const revokedToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: hashToken('revoked-token'),
        label: 'Revoked',
      }).revoke();
      await personalAccessTokenRepository.save(revokedToken);

      await expect(
        apiTokenGuard.canActivate(
          buildContext(authorizedRequest('revoked-token')),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws an UnauthorizedException when the token has expired', async () => {
      const expiredToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: hashToken('expired-token'),
        label: 'Expired',
        expiresAt: daysFromNow(-1),
      });
      await personalAccessTokenRepository.save(expiredToken);

      await expect(
        apiTokenGuard.canActivate(
          buildContext(authorizedRequest('expired-token')),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
