import { PrismaService } from '../../prisma/prisma.service';
import { PasswordResetToken } from '../domain/password-reset-token';
import { User } from '../domain/user';
import { daysFromNow } from '../test-utils/dates';
import { PrismaPasswordResetTokenRepository } from './password-reset-token.repository.prisma';
import { PrismaUserRepository } from './user.repository.prisma';

describe('PrismaPasswordResetTokenRepository', () => {
  let prisma: PrismaService;
  let passwordResetTokenRepository: PrismaPasswordResetTokenRepository;
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(
      prisma,
    );
    userRepository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({
      where: { user: { email: 'jane@example.com' } },
    });
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.passwordResetToken.deleteMany({
      where: { user: { email: 'jane@example.com' } },
    });
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
  });

  describe('save', () => {
    it('saves a PasswordResetToken and finds it back by token hash', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const passwordResetToken = PasswordResetToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
      await passwordResetTokenRepository.save(passwordResetToken);

      const foundPasswordResetToken =
        await passwordResetTokenRepository.findByTokenHash('hashed-token');

      expect(foundPasswordResetToken?.id).toBe(passwordResetToken.id);
      expect(foundPasswordResetToken?.userId).toBe(user.id);
    });

    it('updates an existing PasswordResetToken instead of creating a duplicate when saving again', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const passwordResetToken = PasswordResetToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
      await passwordResetTokenRepository.save(passwordResetToken);

      const usedPasswordResetToken = passwordResetToken.markUsed();
      await passwordResetTokenRepository.save(usedPasswordResetToken);

      const foundPasswordResetToken =
        await passwordResetTokenRepository.findByTokenHash('hashed-token');

      expect(foundPasswordResetToken?.id).toBe(passwordResetToken.id);
      expect(foundPasswordResetToken?.usedAt).toBeInstanceOf(Date);
    });
  });

  describe('findByTokenHash', () => {
    it('returns null when no PasswordResetToken matches the given token hash', async () => {
      const foundPasswordResetToken =
        await passwordResetTokenRepository.findByTokenHash('nonexistent-token');

      expect(foundPasswordResetToken).toBeNull();
    });
  });
});
