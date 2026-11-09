import { daysFromNow } from '../test-utils/dates';
import { PersonalAccessToken } from './personal-access-token';

describe('PersonalAccessToken', () => {
  let personalAccessToken: PersonalAccessToken;
  let expiresAt: Date;

  beforeAll(() => {
    expiresAt = daysFromNow(7);
    personalAccessToken = PersonalAccessToken.create({
      userId: 'user-1',
      tokenHash: 'hashed-token',
      label: 'LinkedIn extension',
      expiresAt,
    });
  });

  describe('create', () => {
    it('creates a PersonalAccessToken with valid props and exposes them back', () => {
      expect(personalAccessToken.userId).toBe('user-1');
      expect(personalAccessToken.tokenHash).toBe('hashed-token');
      expect(personalAccessToken.label).toBe('LinkedIn extension');
      expect(personalAccessToken.expiresAt).toBe(expiresAt);
    });

    it('throws an error when userId is missing', () => {
      expect(() =>
        PersonalAccessToken.create({
          userId: '',
          tokenHash: 'hashed-token',
          label: 'LinkedIn extension',
        }),
      ).toThrow();
    });

    it('throws an error when tokenHash is missing', () => {
      expect(() =>
        PersonalAccessToken.create({
          userId: 'user-1',
          tokenHash: '',
          label: 'LinkedIn extension',
        }),
      ).toThrow();
    });

    it('throws an error when label is missing', () => {
      expect(() =>
        PersonalAccessToken.create({
          userId: 'user-1',
          tokenHash: 'hashed-token',
          label: '',
        }),
      ).toThrow();
    });

    it('leaves expiresAt undefined when not provided (never expires)', () => {
      const neverExpiringToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
      });

      expect(neverExpiringToken.expiresAt).toBeUndefined();
    });

    it('leaves revokedAt and lastUsedAt undefined on creation', () => {
      expect(personalAccessToken.revokedAt).toBeUndefined();
      expect(personalAccessToken.lastUsedAt).toBeUndefined();
    });

    it('generates id and createdAt on creation', () => {
      const anotherPersonalAccessToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
      });

      expect(personalAccessToken.id).toEqual(expect.any(String));
      expect(personalAccessToken.id).not.toBe('');
      expect(personalAccessToken.createdAt).toBeInstanceOf(Date);
      expect(personalAccessToken.id).not.toBe(anotherPersonalAccessToken.id);
    });
  });

  describe('reconstitute', () => {
    it('reconstitutes a PersonalAccessToken from persisted values without regenerating id or createdAt', () => {
      const createdAt = new Date('2026-09-01');
      const reconstitutedExpiresAt = new Date('2026-09-08');
      const lastUsedAt = new Date('2026-09-02T12:00:00');

      const reconstituted = PersonalAccessToken.reconstitute({
        id: 'existing-id',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
        expiresAt: reconstitutedExpiresAt,
        lastUsedAt,
        createdAt,
      });

      expect(reconstituted.id).toBe('existing-id');
      expect(reconstituted.createdAt).toBe(createdAt);
      expect(reconstituted.lastUsedAt).toBe(lastUsedAt);
      expect(reconstituted.revokedAt).toBeUndefined();
    });
  });

  describe('revoke', () => {
    it('marks the PersonalAccessToken as revoked by setting revokedAt', () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const revokedPersonalAccessToken = personalAccessToken.revoke();

      expect(revokedPersonalAccessToken.revokedAt).toEqual(now);

      jest.useRealTimers();
    });

    it('throws an error when the PersonalAccessToken is already revoked', () => {
      const revokedPersonalAccessToken = personalAccessToken.revoke();

      expect(() => revokedPersonalAccessToken.revoke()).toThrow();
    });
  });

  describe('markUsed', () => {
    it('marks the PersonalAccessToken as used by setting lastUsedAt', () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const usedPersonalAccessToken = personalAccessToken.markUsed();

      expect(usedPersonalAccessToken.lastUsedAt).toEqual(now);

      jest.useRealTimers();
    });

    it('allows markUsed to be called again, updating lastUsedAt each time (unlike single-use tokens)', () => {
      const firstUse = new Date('2026-09-01T10:00:00');
      jest.useFakeTimers().setSystemTime(firstUse);
      const firstUsedToken = personalAccessToken.markUsed();

      const secondUse = new Date('2026-09-02T10:00:00');
      jest.setSystemTime(secondUse);
      const secondUsedToken = firstUsedToken.markUsed();

      expect(secondUsedToken.lastUsedAt).toEqual(secondUse);

      jest.useRealTimers();
    });
  });

  describe('isExpired', () => {
    it('returns false when expiresAt is not set', () => {
      const neverExpiringToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
      });

      expect(neverExpiringToken.isExpired()).toBe(false);
    });

    it('returns false when expiresAt is in the future', () => {
      expect(personalAccessToken.isExpired()).toBe(false);
    });

    it('returns true when expiresAt is in the past', () => {
      const expiredToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
        expiresAt: daysFromNow(-1),
      });

      expect(expiredToken.isExpired()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('returns true when not revoked and not expired', () => {
      expect(personalAccessToken.isValid()).toBe(true);
    });

    it('returns false when revoked', () => {
      const revokedPersonalAccessToken = personalAccessToken.revoke();

      expect(revokedPersonalAccessToken.isValid()).toBe(false);
    });

    it('returns false when expired', () => {
      const expiredToken = PersonalAccessToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
        expiresAt: daysFromNow(-1),
      });

      expect(expiredToken.isValid()).toBe(false);
    });
  });
});
