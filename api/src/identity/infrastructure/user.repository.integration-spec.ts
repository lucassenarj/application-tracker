import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../domain/user';
import { PrismaUserRepository } from './user.repository.prisma';

describe('PrismaUserRepository', () => {
  let prisma: PrismaService;
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    userRepository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: 'jane@example.com' } });
  });

  describe('save', () => {
    it('saves a User and finds it back by email', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });

      await userRepository.save(user);
      const foundUser = await userRepository.findByEmail('jane@example.com');

      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe('jane@example.com');
    });

    it('updates an existing User instead of creating a duplicate when saving again', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const updatedUser = User.reconstitute({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        authProvider: user.authProvider,
        name: 'Jane Doe',
        avatar: user.avatar,
        role: user.role,
        isActive: false,
        createdAt: user.createdAt,
      });
      await userRepository.save(updatedUser);

      const foundUser = await userRepository.findByEmail('jane@example.com');

      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.name).toBe('Jane Doe');
      expect(foundUser?.isActive).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('returns null when no User matches the given email', async () => {
      const foundUser = await userRepository.findByEmail(
        'nonexistent@example.com',
      );

      expect(foundUser).toBeNull();
    });
  });

  describe('findById', () => {
    it('finds a User by id', async () => {
      const user = User.create({
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      const foundUser = await userRepository.findById(user.id);

      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe('jane@example.com');
    });

    it('returns null when no User matches the given id', async () => {
      const foundUser = await userRepository.findById('nonexistent-id');

      expect(foundUser).toBeNull();
    });
  });
});
