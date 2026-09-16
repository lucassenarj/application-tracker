import { User } from './user';

describe('User', () => {
  describe('create', () => {
    it('creates a User with a valid email and exposes it back', () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });

      expect(user.email).toBe('jane@example.com');
    });

    it('normalizes email to lowercase on creation', () => {
      const user = User.create({
        email: 'Jane@Example.com',
        passwordHash: 'hashed-password',
      });

      expect(user.email).toBe('jane@example.com');
    });

    it('throws an error when email is missing', () => {
      expect(() =>
        User.create({ email: '', passwordHash: 'hashed-password' }),
      ).toThrow();
    });

    it('throws an error when email format is invalid', () => {
      expect(() =>
        User.create({ email: 'not-an-email', passwordHash: 'hashed-password' }),
      ).toThrow();
    });

    it('throws an error when passwordHash is missing without social login', () => {
      expect(() => User.create({ email: 'jane@example.com' })).toThrow();
    });

    it('defaults to a non-administrator user', () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });

      expect(user.role).toBe('USER');
    });

    it('defaults to an active user', () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });

      expect(user.isActive).toBe(true);
    });

    it('generates id on creation', () => {
      const first = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      const second = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });

      expect(first.id).toEqual(expect.any(String));
      expect(first.id).not.toBe('');
      expect(first.id).not.toBe(second.id);
    });
  });
});
