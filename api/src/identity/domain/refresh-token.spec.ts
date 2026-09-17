import { RefreshToken } from './refresh-token';

describe('RefreshToken', () => {
  describe('create', () => {
    it('creates a RefreshToken with valid props and exposes them back', () => {
      const expiresAt = new Date('2026-10-01');

      const refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt,
      });

      expect(refreshToken.userId).toBe('user-1');
      expect(refreshToken.tokenHash).toBe('hashed-token');
      expect(refreshToken.familyId).toBe('family-1');
      expect(refreshToken.expiresAt).toBe(expiresAt);
    });

    it('throws an error when userId is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: '',
          tokenHash: 'hashed-token',
          familyId: 'family-1',
          expiresAt: new Date('2026-10-01'),
        }),
      ).toThrow();
    });

    it('throws an error when tokenHash is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: 'user-1',
          tokenHash: '',
          familyId: 'family-1',
          expiresAt: new Date('2026-10-01'),
        }),
      ).toThrow();
    });

    it('throws an error when familyId is missing', () => {
      expect(() =>
        RefreshToken.create({
          userId: 'user-1',
          tokenHash: 'hashed-token',
          familyId: '',
          expiresAt: new Date('2026-10-01'),
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
        }),
      ).toThrow();
    });

    it('leaves revokedAt undefined on creation', () => {
      const refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: new Date('2026-10-01'),
      });

      expect(refreshToken.revokedAt).toBeUndefined();
    });

    it('generates id and createdAt on creation', () => {
      const firstRefreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: new Date('2026-10-01'),
      });
      const secondRefreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: new Date('2026-10-01'),
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
      });

      expect(refreshToken.id).toBe('existing-id');
      expect(refreshToken.createdAt).toBe(createdAt);
      expect(refreshToken.revokedAt).toBe(revokedAt);
    });
  });

  describe('revoke', () => {
    it('revokes the RefreshToken by setting revokedAt', () => {
      const now = new Date('2026-09-17T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      const refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: new Date('2026-10-01'),
      });

      const revokedRefreshToken = refreshToken.revoke();

      expect(revokedRefreshToken.revokedAt).toEqual(now);

      jest.useRealTimers();
    });

    it('throws an error when the RefreshToken is already revoked', () => {
      const refreshToken = RefreshToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: new Date('2026-10-01'),
      });
      const revokedRefreshToken = refreshToken.revoke();

      expect(() => revokedRefreshToken.revoke()).toThrow();
    });
  });
});
