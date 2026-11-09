import { PrismaService } from '../../prisma/prisma.service';
import { PersonalAccessToken } from '../domain/personal-access-token';
import { User } from '../domain/user';
import { daysFromNow } from '../test-utils/dates';
import { PrismaPersonalAccessTokenRepository } from './personal-access-token.repository.prisma';
import { PrismaUserRepository } from './user.repository.prisma';

describe('PrismaPersonalAccessTokenRepository', () => {
  let prisma: PrismaService;
  let personalAccessTokenRepository: PrismaPersonalAccessTokenRepository;
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    personalAccessTokenRepository = new PrismaPersonalAccessTokenRepository(
      prisma,
    );
    userRepository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.personalAccessToken.deleteMany({
      where: {
        user: { email: { in: ['jane@example.com', 'john@example.com'] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['jane@example.com', 'john@example.com'] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.personalAccessToken.deleteMany({
      where: {
        user: { email: { in: ['jane@example.com', 'john@example.com'] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['jane@example.com', 'john@example.com'] } },
    });
  });

  describe('save', () => {
    let user: User;
    let personalAccessToken: PersonalAccessToken;

    beforeEach(async () => {
      user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      personalAccessToken = PersonalAccessToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
        expiresAt: daysFromNow(7),
      });
      await personalAccessTokenRepository.save(personalAccessToken);
    });

    it('saves a PersonalAccessToken and finds it back by token hash', async () => {
      const foundPersonalAccessToken =
        await personalAccessTokenRepository.findByTokenHash('hashed-token');

      expect(foundPersonalAccessToken?.id).toBe(personalAccessToken.id);
      expect(foundPersonalAccessToken?.userId).toBe(user.id);
    });

    it('updates an existing PersonalAccessToken instead of creating a duplicate when saving again', async () => {
      const usedPersonalAccessToken = personalAccessToken.markUsed();
      await personalAccessTokenRepository.save(usedPersonalAccessToken);

      const foundPersonalAccessToken =
        await personalAccessTokenRepository.findByTokenHash('hashed-token');

      expect(foundPersonalAccessToken?.id).toBe(personalAccessToken.id);
      expect(foundPersonalAccessToken?.lastUsedAt).toBeInstanceOf(Date);
    });
    it('persists a PersonalAccessToken with no expiresAt (never expires)', async () => {
      const neverExpiringToken = PersonalAccessToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-no-expiry',
        label: 'Never expires',
      });
      await personalAccessTokenRepository.save(neverExpiringToken);

      const foundToken = await personalAccessTokenRepository.findByTokenHash(
        'hashed-token-no-expiry',
      );

      expect(foundToken?.expiresAt).toBeUndefined();
    });
  });

  describe('findByTokenHash', () => {
    it('returns null when no PersonalAccessToken matches the given token hash', async () => {
      const foundPersonalAccessToken =
        await personalAccessTokenRepository.findByTokenHash(
          'nonexistent-token',
        );

      expect(foundPersonalAccessToken).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    let user: User;

    beforeEach(async () => {
      user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);
    });

    it('returns every PersonalAccessToken belonging to the given user', async () => {
      const firstToken = PersonalAccessToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-1',
        label: 'Token A',
      });
      const secondToken = PersonalAccessToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-2',
        label: 'Token B',
      });
      await personalAccessTokenRepository.save(firstToken);
      await personalAccessTokenRepository.save(secondToken);

      const tokens = await personalAccessTokenRepository.findAllByUserId(
        user.id,
      );

      expect(tokens.map((token) => token.label)).toEqual(
        expect.arrayContaining(['Token A', 'Token B']),
      );
    });

    it('does not return tokens belonging to a different user', async () => {
      const otherUser = User.create({
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(otherUser);

      const userToken = PersonalAccessToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-1',
        label: 'Token A',
      });
      const otherUserToken = PersonalAccessToken.create({
        userId: otherUser.id,
        tokenHash: 'hashed-token-2',
        label: 'Other user token',
      });
      await personalAccessTokenRepository.save(userToken);
      await personalAccessTokenRepository.save(otherUserToken);

      const tokens = await personalAccessTokenRepository.findAllByUserId(
        user.id,
      );

      expect(tokens.map((token) => token.label)).not.toContain(
        'Other user token',
      );
    });
  });

  describe('findById', () => {
    it('returns the PersonalAccessToken matching the given id', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const personalAccessToken = PersonalAccessToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        label: 'LinkedIn extension',
      });
      await personalAccessTokenRepository.save(personalAccessToken);

      const foundPersonalAccessToken =
        await personalAccessTokenRepository.findById(personalAccessToken.id);

      expect(foundPersonalAccessToken?.id).toBe(personalAccessToken.id);
    });

    it('returns null when no PersonalAccessToken matches the given id', async () => {
      const foundPersonalAccessToken =
        await personalAccessTokenRepository.findById('nonexistent-id');

      expect(foundPersonalAccessToken).toBeNull();
    });
  });
});
