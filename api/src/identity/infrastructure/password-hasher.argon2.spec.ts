import { Argon2PasswordHasher } from './password-hasher.argon2';

describe('Argon2PasswordHasher', () => {
  describe('hash', () => {
    it('hashes a password and verify confirms it matches', async () => {
      const hasher = new Argon2PasswordHasher();

      const hashedPassword = await hasher.hash('correct-horse-battery-staple');
      const isValid = await hasher.verify(
        'correct-horse-battery-staple',
        hashedPassword,
      );

      expect(isValid).toBe(true);
    });
  });

  describe('verify', () => {
    it('returns false for an incorrect password', async () => {
      const hasher = new Argon2PasswordHasher();

      const hashedPassword = await hasher.hash('correct-horse-battery-staple');
      const isValid = await hasher.verify('wrong-password', hashedPassword);

      expect(isValid).toBe(false);
    });
  });
});
