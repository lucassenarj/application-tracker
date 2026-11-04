import { daysFromNow } from '../test-utils/dates';
import { EmailVerificationToken } from './email-verification-token';

describe('EmailVerificationToken', () => {
  describe('create', () => {
    it('creates an EmailVerificationToken with valid props and exposes them back', () => {
      const expiresAt = daysFromNow(1);

      const emailVerificationToken = EmailVerificationToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt,
      });

      expect(emailVerificationToken.userId).toBe('user-1');
      expect(emailVerificationToken.tokenHash).toBe('hashed-token');
      expect(emailVerificationToken.expiresAt).toBe(expiresAt);
    });

    it('throws an error when userId is missing', () => {
      expect(() =>
        EmailVerificationToken.create({
          userId: '',
          tokenHash: 'hashed-token',
          expiresAt: daysFromNow(1),
        }),
      ).toThrow();
    });

    it('throws an error when tokenHash is missing', () => {
      expect(() =>
        EmailVerificationToken.create({
          userId: 'user-1',
          tokenHash: '',
          expiresAt: daysFromNow(1),
        }),
      ).toThrow();
    });

    it('throws an error when expiresAt is missing', () => {
      expect(() =>
        EmailVerificationToken.create({
          userId: 'user-1',
          tokenHash: 'hashed-token',
          expiresAt: undefined as unknown as Date,
        }),
      ).toThrow();
    });

    it('leaves usedAt undefined on creation', () => {
      const emailVerificationToken = EmailVerificationToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });

      expect(emailVerificationToken.usedAt).toBeUndefined();
    });

    it('generates id and createdAt on creation', () => {
      const firstEmailVerificationToken = EmailVerificationToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
      const secondEmailVerificationToken = EmailVerificationToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });

      expect(firstEmailVerificationToken.id).toEqual(expect.any(String));
      expect(firstEmailVerificationToken.id).not.toBe('');
      expect(firstEmailVerificationToken.createdAt).toBeInstanceOf(Date);
      expect(firstEmailVerificationToken.id).not.toBe(
        secondEmailVerificationToken.id,
      );
    });
  });

  describe('reconstitute', () => {
    it('reconstitutes an EmailVerificationToken from persisted values without regenerating id or createdAt', () => {
      const createdAt = new Date('2026-09-01');
      const expiresAt = new Date('2026-09-02');
      const usedAt = new Date('2026-09-01T12:00:00');

      const emailVerificationToken = EmailVerificationToken.reconstitute({
        id: 'existing-id',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt,
        createdAt,
        usedAt,
      });

      expect(emailVerificationToken.id).toBe('existing-id');
      expect(emailVerificationToken.createdAt).toBe(createdAt);
      expect(emailVerificationToken.usedAt).toBe(usedAt);
    });
  });

  describe('markUsed', () => {
    let emailVerificationToken: EmailVerificationToken;

    beforeAll(() => {
      emailVerificationToken = EmailVerificationToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
    });

    it('marks the EmailVerificationToken as used by setting usedAt', () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const usedEmailVerificationToken = emailVerificationToken.markUsed();

      expect(usedEmailVerificationToken.usedAt).toEqual(now);

      jest.useRealTimers();
    });

    it('throws an error when the EmailVerificationToken is already used', () => {
      const usedEmailVerificationToken = emailVerificationToken.markUsed();

      expect(() => usedEmailVerificationToken.markUsed()).toThrow();
    });
  });
});
