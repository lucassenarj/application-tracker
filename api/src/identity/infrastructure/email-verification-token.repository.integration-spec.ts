import { PrismaService } from '../../prisma/prisma.service';
import { EmailVerificationToken } from '../domain/email-verification-token';
import { User } from '../domain/user';
import { daysFromNow } from '../test-utils/dates';
import { PrismaEmailVerificationTokenRepository } from './email-verification-token.repository.prisma';
import { PrismaUserRepository } from './user.repository.prisma';

describe('PrismaEmailVerificationTokenRepository', () => {
  let prisma: PrismaService;
  let emailVerificationTokenRepository: PrismaEmailVerificationTokenRepository;
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    emailVerificationTokenRepository =
      new PrismaEmailVerificationTokenRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: 'jane@example.com' } },
    });
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: 'jane@example.com' } },
    });
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
  });

  describe('save', () => {
    let user: User;

    beforeEach(async () => {
      user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);
    });

    it('saves an EmailVerificationToken and finds it back by token hash', async () => {
      const emailVerificationToken = EmailVerificationToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
      await emailVerificationTokenRepository.save(emailVerificationToken);

      const foundEmailVerificationToken =
        await emailVerificationTokenRepository.findByTokenHash('hashed-token');

      expect(foundEmailVerificationToken?.id).toBe(emailVerificationToken.id);
      expect(foundEmailVerificationToken?.userId).toBe(user.id);
    });

    it('updates an existing EmailVerificationToken instead of creating a duplicate when saving again', async () => {
      const emailVerificationToken = EmailVerificationToken.create({
        userId: user.id,
        tokenHash: 'hashed-token',
        expiresAt: daysFromNow(1),
      });
      await emailVerificationTokenRepository.save(emailVerificationToken);

      const usedEmailVerificationToken = emailVerificationToken.markUsed();
      await emailVerificationTokenRepository.save(usedEmailVerificationToken);

      const foundEmailVerificationToken =
        await emailVerificationTokenRepository.findByTokenHash('hashed-token');

      expect(foundEmailVerificationToken?.id).toBe(emailVerificationToken.id);
      expect(foundEmailVerificationToken?.usedAt).toBeInstanceOf(Date);
    });
  });

  describe('findByTokenHash', () => {
    it('returns null when no EmailVerificationToken matches the given token hash', async () => {
      const foundEmailVerificationToken =
        await emailVerificationTokenRepository.findByTokenHash(
          'nonexistent-token',
        );

      expect(foundEmailVerificationToken).toBeNull();
    });
  });
});
