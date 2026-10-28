import { daysFromNow } from '../test-utils/dates';
import { RefreshToken } from './refresh-token';

describe('RefreshToken', () => {
  describe('create', () => {
    it('creates a RefreshToken with valid props and exposes them back', () => {
      const expiresAt = daysFromNow(30);

      const refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt,
        rememberMe: true,
      });

      expect(refreshToken.userId).toBe('user-1');
      expect(refreshToken.tokenHash).toBe('hashed-token');
      expect(refreshToken.familyId).toBe('family-1');
      expect(refreshToken.expiresAt).toBe(expiresAt);
      expect(refreshToken.rememberMe).toBe(true);
    });

    it('throws an error when userId is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: '',
          tokenHash: 'hashed-token',
          familyId: 'family-1',
          expiresAt: daysFromNow(30),
          rememberMe: true,
        }),
      ).toThrow();
    });

    it('throws an error when tokenHash is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: 'user-1',
          tokenHash: '',
          familyId: 'family-1',
          expiresAt: daysFromNow(30),
          rememberMe: true,
        }),
      ).toThrow();
    });

    it('throws an error when familyId is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: 'user-1',
          tokenHash: 'hashed-token',
          familyId: '',
          expiresAt: daysFromNow(30),
          rememberMe: true,
        }),
      ).toThrow();
    });

    it('throws an error when expiresAt is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: 'user-1',
          tokenHash: 'hashed-token',
          familyId: 'family-1',
          expiresAt: undefined as unknown as Date,
          rememberMe: true,
        }),
      ).toThrow();
    });

    it('leaves revokedAt undefined on creation', () => {
      const refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });

      expect(refreshToken.revokedAt).toBeUndefined();
    });

    it('generates id and createdAt on creation', () => {
      const firstRefreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      const secondRefreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });

      expect(firstRefreshToken.id).toEqual(expect.any(String));
      expect(firstRefreshToken.id).not.toBe('');
      expect(firstRefreshToken.createdAt).toBeInstanceOf(Date);
      expect(firstRefreshToken.id).not.toBe(secondRefreshToken.id);
    });
  });

  describe('reconstitute', () => {
    it('reconstitutes a RefreshToken from persisted values without regenerating id or createdAt', () => {
      const createdAt = new Date('2026-09-01');
      const expiresAt = new Date('2026-10-01');
      const revokedAt = new Date('2026-09-15');

      const refreshToken = RefreshToken.reconstitute({
        id: 'existing-id',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt,
        createdAt,
        revokedAt,
        rememberMe: true,
      });

      expect(refreshToken.id).toBe('existing-id');
      expect(refreshToken.createdAt).toBe(createdAt);
      expect(refreshToken.revokedAt).toBe(revokedAt);
      expect(refreshToken.rememberMe).toBe(true);
    });
  });

  describe('revoke', () => {
    let refreshToken: RefreshToken;

    beforeAll(() => {
      refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
    });

    it('revokes the RefreshToken by setting revokedAt', () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const revokedRefreshToken = refreshToken.revoke();

      expect(revokedRefreshToken.revokedAt).toEqual(now);
      expect(revokedRefreshToken.rememberMe).toBe(true);

      jest.useRealTimers();
    });

    it('throws an error when the RefreshToken is already revoked', () => {
      const revokedRefreshToken = refreshToken.revoke();

      expect(() => revokedRefreshToken.revoke()).toThrow();
    });
  });
});
