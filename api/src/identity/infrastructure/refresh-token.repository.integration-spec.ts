import { PrismaService } from '../../prisma/prisma.service';
import { RefreshToken } from '../domain/refresh-token';
import { User } from '../domain/user';
import { daysFromNow } from '../test-utils/dates';
import { PrismaRefreshTokenRepository } from './refresh-token.repository.prisma';
import { PrismaUserRepository } from './user.repository.prisma';

describe('PrismaRefreshTokenRepository', () => {
  let prisma: PrismaService;
  let refreshTokenRepository: PrismaRefreshTokenRepository;
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    refreshTokenRepository = new PrismaRefreshTokenRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: { user: { email: 'jane@example.com' } },
    });
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({
      where: { user: { email: 'jane@example.com' } },
    });
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
  });

  describe('save', () => {
    it('saves a RefreshToken and finds it back by token hash', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const refreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(refreshToken);

      const foundRefreshToken =
        await refreshTokenRepository.findByTokenHash('hashed-token');

      expect(foundRefreshToken?.id).toBe(refreshToken.id);
      expect(foundRefreshToken?.userId).toBe(user.id);
    });

    it('updates an existing RefreshToken instead of creating a duplicate when saving again', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const refreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(refreshToken);

      const revokedRefreshToken = refreshToken.revoke();
      await refreshTokenRepository.save(revokedRefreshToken);

      const foundRefreshToken =
        await refreshTokenRepository.findByTokenHash('hashed-token');

      expect(foundRefreshToken?.id).toBe(refreshToken.id);
      expect(foundRefreshToken?.revokedAt).toBeInstanceOf(Date);
    });
  });

  describe('findByTokenHash', () => {
    it('returns null when no RefreshToken matches the given token hash', async () => {
      const foundRefreshToken =
        await refreshTokenRepository.findByTokenHash('nonexistent-token');

      expect(foundRefreshToken).toBeNull();
    });
  });

  describe('findAllByFamilyId', () => {
    it('finds all RefreshTokens belonging to the given family', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const firstRefreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-1',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(firstRefreshToken);

      const secondRefreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-2',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(secondRefreshToken);

      const otherFamilyRefreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-3',
        familyId: 'family-2',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(otherFamilyRefreshToken);

      const foundRefreshTokens =
        await refreshTokenRepository.findAllByFamilyId('family-1');
      const foundIds = foundRefreshTokens.map((rt) => rt.id);

      expect(foundRefreshTokens).toHaveLength(2);
      expect(foundIds).toEqual(
        expect.arrayContaining([firstRefreshToken.id, secondRefreshToken.id]),
      );
    });

    it('returns an empty array when no RefreshTokens match the given family', async () => {
      const foundRefreshTokens =
        await refreshTokenRepository.findAllByFamilyId('nonexistent-family');

      expect(foundRefreshTokens).toEqual([]);
    });
  });

  describe('findAllByUserId', () => {
    it('finds all RefreshTokens belonging to the given user, across multiple families', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const firstRefreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-1',
        familyId: 'family-1',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(firstRefreshToken);

      const secondRefreshToken = RefreshToken.create({
        userId: user.id,
        tokenHash: 'hashed-token-2',
        familyId: 'family-2',
        expiresAt: daysFromNow(30),
        rememberMe: true,
      });
      await refreshTokenRepository.save(secondRefreshToken);

      const foundRefreshTokens = await refreshTokenRepository.findAllByUserId(
        user.id,
      );
      const foundIds = foundRefreshTokens.map((rt) => rt.id);

      expect(foundRefreshTokens).toHaveLength(2);
      expect(foundIds).toEqual(
        expect.arrayContaining([firstRefreshToken.id, secondRefreshToken.id]),
      );
    });
    it('returns an empty array when no RefreshTokens match the given user', async () => {
      const foundRefreshTokens =
        await refreshTokenRepository.findAllByUserId('nonexistent-user');

      expect(foundRefreshTokens).toEqual([]);
    });
  });
});
