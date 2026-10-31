import { PrismaService } from '../../prisma/prisma.service';
import { Application } from '../../applications/domain/application';
import { PrismaApplicationRepository } from '../../applications/infrastructure/application.repository.prisma';
import { Company } from '../../companies/domain/company';
import { PrismaCompanyRepository } from '../../companies/infrastructure/company.repository.prisma';
import { Tag } from '../domain/tag';
import { PrismaTagRepository } from './tag.repository.prisma';

describe('PrismaTagRepository', () => {
  let prisma: PrismaService;
  let tagRepository: PrismaTagRepository;
  let remote: Tag;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    tagRepository = new PrismaTagRepository(prisma);
  });

  afterAll(async () => {
    await prisma.tag.deleteMany({
      where: { name: { in: ['Remote', 'Remote Renamed', 'Dream Job'] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.tag.deleteMany({
      where: { name: { in: ['Remote', 'Remote Renamed', 'Dream Job'] } },
    });
    remote = Tag.create({ name: 'Remote' });
    await tagRepository.save(remote);
  });

  describe('save', () => {
    it('saves a Tag and finds it back by its normalized name', async () => {
      const tag = Tag.create({ name: 'Dream Job' });

      await tagRepository.save(tag);
      const foundTag = await tagRepository.findByNormalizedName('Dream Job');

      expect(foundTag?.id).toBe(tag.id);
      expect(foundTag?.name).toBe('Dream Job');
    });

    it('updates the name of the existing row when saving a renamed Tag with the same id', async () => {
      const renamed = remote.rename('Remote Renamed');
      await tagRepository.save(renamed);

      const foundByOldName = await tagRepository.findByNormalizedName('Remote');
      const foundByNewName = await tagRepository.findById(remote.id);

      expect(foundByOldName).toBeNull();
      expect(foundByNewName?.id).toBe(remote.id);
      expect(foundByNewName?.name).toBe('Remote Renamed');
    });
  });

  describe('findByNormalizedName', () => {
    it('returns null when no Tag matches the given normalized name', async () => {
      const foundTag =
        await tagRepository.findByNormalizedName('Nonexistent Tag');

      expect(foundTag).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the Tag when one exists for the given id', async () => {
      const foundTag = await tagRepository.findById(remote.id);

      expect(foundTag?.id).toBe(remote.id);
      expect(foundTag?.name).toBe('Remote');
    });

    it('returns null when no Tag matches the given id', async () => {
      const foundTag = await tagRepository.findById('nonexistent-id');

      expect(foundTag).toBeNull();
    });
  });

  describe('search', () => {
    beforeAll(async () => {
      await tagRepository.save(Tag.create({ name: 'Search Test Dream Job' }));

      for (let i = 0; i < 15; i++) {
        await tagRepository.save(
          Tag.create({ name: `Search Test Widget Tag ${i}` }),
        );
      }
    });

    afterAll(async () => {
      await prisma.tag.deleteMany({
        where: { name: { startsWith: 'Search Test' } },
      });
    });

    it('returns Tags whose name matches the search term', async () => {
      const results = await tagRepository.search('remote');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(remote.id);
    });

    it('matches on a partial/prefix word, for autocomplete-style typing', async () => {
      const results = await tagRepository.search('dream');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Search Test Dream Job');
    });

    it('returns an empty array when no Tag matches', async () => {
      const results = await tagRepository.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('limits results to at most 10 tags', async () => {
      const results = await tagRepository.search('widget');

      expect(results).toHaveLength(10);
    });
  });

  describe('findPopular', () => {
    let popularTag: Tag;
    let rareTag: Tag;

    beforeAll(async () => {
      const applicationRepository = new PrismaApplicationRepository(prisma);
      const companyRepository = new PrismaCompanyRepository(prisma);
      const company = Company.create({ name: 'Popular Tag Test Co' });
      await companyRepository.save(company);

      popularTag = Tag.create({ name: 'Popular Tag Test Remote' });
      await tagRepository.save(popularTag);
      rareTag = Tag.create({ name: 'Popular Tag Test Rare' });
      await tagRepository.save(rareTag);

      for (let i = 0; i < 3; i++) {
        await applicationRepository.save(
          Application.create({
            title: `Popular Tag Test App ${i}`,
            companyId: company.id,
            userId: 'user-1',
            tagIds: [popularTag.id],
          }),
        );
      }
      await applicationRepository.save(
        Application.create({
          title: 'Popular Tag Test App Rare',
          companyId: company.id,
          userId: 'user-1',
          tagIds: [rareTag.id],
        }),
      );
    });

    afterAll(async () => {
      await prisma.statusChange.deleteMany({
        where: { application: { title: { startsWith: 'Popular Tag Test' } } },
      });
      await prisma.application.deleteMany({
        where: { title: { startsWith: 'Popular Tag Test' } },
      });
      await prisma.company.deleteMany({
        where: { name: 'Popular Tag Test Co' },
      });
      await prisma.tag.deleteMany({
        where: { name: { startsWith: 'Popular Tag Test' } },
      });
    });

    it('orders Tags by how many Applications use them, most popular first', async () => {
      const results = await tagRepository.findPopular(50);

      const popularIndex = results.findIndex((t) => t.id === popularTag.id);
      const rareIndex = results.findIndex((t) => t.id === rareTag.id);

      expect(popularIndex).toBeGreaterThanOrEqual(0);
      expect(rareIndex).toBeGreaterThanOrEqual(0);
      expect(popularIndex).toBeLessThan(rareIndex);
    });

    it('limits results to the given limit', async () => {
      const results = await tagRepository.findPopular(1);

      expect(results).toHaveLength(1);
    });
  });
});
