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

  describe('reconstitute', () => {
    it('reconstitutes a User from persisted values without regenerating id or re-normalizing email', () => {
      const user = User.reconstitute({
        id: 'existing-id',
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
        authProvider: 'PASSWORD',
        name: 'Jane Doe',
        avatar: 'https://example.com/avatar.png',
        role: 'ADMIN',
        isActive: false,
        createdAt: new Date('2026-01-01'),
      });

      expect(user.id).toBe('existing-id');
      expect(user.email).toBe('jane@example.com');
      expect(user.role).toBe('ADMIN');
      expect(user.isActive).toBe(false);
    });
  });

  describe('updateProfile', () => {
    let user: User;

    beforeAll(() => {
      user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
        name: 'Original Name',
        avatar: 'https://example.com/original.png',
      });
    });

    it('updates name when provided', () => {
      const updatedUser = user.updateProfile({ name: 'Jane Doe' });

      expect(updatedUser.name).toBe('Jane Doe');
    });

    it('updates avatar when provided', () => {
      const updatedUser = user.updateProfile({
        avatar: 'https://example.com/new-avatar.png',
      });

      expect(updatedUser.avatar).toBe('https://example.com/new-avatar.png');
    });

    it('leaves name unchanged when not provided', () => {
      const updatedUser = user.updateProfile({
        avatar: 'https://example.com/new-avatar.png',
      });

      expect(updatedUser.name).toBe('Original Name');
    });

    it('leaves avatar unchanged when not provided', () => {
      const updatedUser = user.updateProfile({ name: 'Jane Doe' });

      expect(updatedUser.avatar).toBe('https://example.com/original.png');
    });

    it('does not mutate the original User instance', () => {
      user.updateProfile({ name: 'Jane Doe' });

      expect(user.name).toBe('Original Name');
    });

    it('updates phone when provided', () => {
      const updatedUser = user.updateProfile({ phone: '+15551234567' });

      expect(updatedUser.phone).toBe('+15551234567');
    });

    it('leaves phone unchanged when not provided', () => {
      const updatedUser = user.updateProfile({ name: 'Jane Doe' });

      expect(updatedUser.phone).toBeUndefined();
    });

    it('updates bio when provided', () => {
      const updatedUser = user.updateProfile({ bio: 'Backend engineer.' });

      expect(updatedUser.bio).toBe('Backend engineer.');
    });

    it('leaves bio unchanged when not provided', () => {
      const updatedUser = user.updateProfile({ name: 'Jane Doe' });

      expect(updatedUser.bio).toBeUndefined();
    });

    it('updates language when provided', () => {
      const updatedUser = user.updateProfile({ language: 'en-US' });

      expect(updatedUser.language).toBe('en-US');
    });

    it('leaves language unchanged when not provided', () => {
      const updatedUser = user.updateProfile({ name: 'Jane Doe' });

      expect(updatedUser.language).toBeUndefined();
    });

    it('updates defaultCurrency when provided', () => {
      const updatedUser = user.updateProfile({ defaultCurrency: 'USD' });

      expect(updatedUser.defaultCurrency).toBe('USD');
    });

    it('leaves defaultCurrency unchanged when not provided', () => {
      const updatedUser = user.updateProfile({ name: 'Jane Doe' });

      expect(updatedUser.defaultCurrency).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    let user: User;

    beforeAll(() => {
      user = User.create({
        email: 'jane@example.com',
        passwordHash: 'original-hash',
      });
    });

    it('updates passwordHash to the newly provided hash', () => {
      const updatedUser = user.changePassword('new-hash');

      expect(updatedUser.passwordHash).toBe('new-hash');
    });
    it('does not mutate the original User instance', () => {
      user.changePassword('new-hash');

      expect(user.passwordHash).toBe('original-hash');
    });
    it('leaves other fields (e.g. email, name) unchanged', () => {
      const updatedUser = user.changePassword('new-hash');

      expect(updatedUser.email).toBe('jane@example.com');
      expect(updatedUser.id).toBe(user.id);
    });
    it('throws an error when newPasswordHash is empty', () => {
      expect(() => user.changePassword('')).toThrow();
    });
  });

  describe('verifyEmail', () => {
    let user: User;

    beforeAll(() => {
      user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
    });

    it('sets emailVerifiedAt to the current date and time', () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      const verifiedUser = user.verifyEmail();

      expect(verifiedUser.emailVerifiedAt).toEqual(now);

      jest.useRealTimers();
    });

    it('does not mutate the original User instance', () => {
      user.verifyEmail();

      expect(user.emailVerifiedAt).toBeUndefined();
    });

    it('leaves other fields unchanged', () => {
      const verifiedUser = user.verifyEmail();

      expect(verifiedUser.email).toBe('jane@example.com');
      expect(verifiedUser.id).toBe(user.id);
    });

    it('throws an error when emailVerifiedAt is already set', () => {
      const verifiedUser = user.verifyEmail();

      expect(() => verifiedUser.verifyEmail()).toThrow();
    });
  });
});
