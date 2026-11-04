import { daysFromNow } from '../test-utils/dates';
import { PasswordResetToken } from './password-reset-token';

describe('PasswordResetToken', () => {
  describe('create', () => {
    it('creates a PasswordResetToken with valid props and exposes them back', () => {
      const expiresAt = daysFromNow(1);

      const passwordResetToken = PasswordResetToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt,
      });

      expect(passwordResetToken.userId).toBe('user-1');
      expect(passwordResetToken.tokenHash).toBe('hashed-token');
      expect(passwordResetToken.expiresAt).toBe(expiresAt);
    });

    it('throws an error when userId is missing', () => {
      expect(() =>
        PasswordResetToken.create({
          userId: '',
          tokenHash: 'hashed-token',
          expiresAt: daysFromNow(1),
        }),
      ).toThrow();
    });

    it('throws an error when tokenHash is missing', () => {
      expect(() =>
        PasswordResetToken.create({
          userId: 'user-1',
          tokenHash: '',
          expiresAt: daysFromNow(1),
        }),
      ).toThrow();
    });

    it('throws an error when expiresAt is missing', () => {
      expect(() =>
        PasswordResetToken.create({
          userId: 'user-1',
          tokenHash: 'hashed-token',
          expiresAt: undefined as unknown as Date,
        }),
      ).toThrow();
    });

    it('leaves usedAt undefined on creation', () => {
      const passwordResetToken = PasswordResetToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });

      expect(passwordResetToken.usedAt).toBeUndefined();
    });

    it('generates id and createdAt on creation', () => {
      const firstPasswordResetToken = PasswordResetToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
      const secondPasswordResetToken = PasswordResetToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });

      expect(firstPasswordResetToken.id).toEqual(expect.any(String));
      expect(firstPasswordResetToken.id).not.toBe('');
      expect(firstPasswordResetToken.createdAt).toBeInstanceOf(Date);
      expect(firstPasswordResetToken.id).not.toBe(secondPasswordResetToken.id);
    });
  });

  describe('reconstitute', () => {
    it('reconstitutes a PasswordResetToken from persisted values without regenerating id or createdAt', () => {
      const createdAt = new Date('2026-09-01');
      const expiresAt = new Date('2026-09-02');
      const usedAt = new Date('2026-09-01T12:00:00');

      const passwordResetToken = PasswordResetToken.reconstitute({
        id: 'existing-id',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt,
        createdAt,
        usedAt,
      });

      expect(passwordResetToken.id).toBe('existing-id');
      expect(passwordResetToken.createdAt).toBe(createdAt);
      expect(passwordResetToken.usedAt).toBe(usedAt);
    });
  });

  describe('markUsed', () => {
    let passwordResetToken: PasswordResetToken;

    beforeAll(() => {
      passwordResetToken = PasswordResetToken.create({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
    });

    it('marks the PasswordResetToken as used by setting usedAt', () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const usedPasswordResetToken = passwordResetToken.markUsed();

      expect(usedPasswordResetToken.usedAt).toEqual(now);

      jest.useRealTimers();
    });

    it('throws an error when the PasswordResetToken is already used', () => {
      const usedPasswordResetToken = passwordResetToken.markUsed();

      expect(() => usedPasswordResetToken.markUsed()).toThrow();
    });
  });
});
