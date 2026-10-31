import { ConflictException, NotFoundException } from '@nestjs/common';
import { Tag } from './domain/tag';
import { TagsService } from './tags.service';
import { FakeTagRepository } from './test-utils/fakes/tag.repository.fake';

describe('TagsService', () => {
  let tagsService: TagsService;
  let tagRepository: FakeTagRepository;
  let remote: Tag;
  let dreamJob: Tag;

  beforeEach(async () => {
    tagRepository = new FakeTagRepository();
    tagsService = new TagsService(tagRepository);
    remote = await tagsService.create('Remote');
    dreamJob = await tagsService.create('Dream Job');
  });

  describe('create', () => {
    it('creates a Tag with the given name', async () => {
      const tag = await tagsService.create('Urgent');

      expect(tag.name).toBe('Urgent');

      const saved = await tagRepository.findById(tag.id);
      expect(saved?.id).toBe(tag.id);
    });

    it('throws a ConflictException when a Tag with the given name already exists', async () => {
      await expect(tagsService.create('Remote')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws a ConflictException when a Tag with the given name already exists in a different case', async () => {
      await expect(tagsService.create('REMOTE')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOrCreate', () => {
    it('returns the existing Tag when one already exists with the given name', async () => {
      const result = await tagsService.findOrCreate('Remote');

      expect(result.id).toBe(remote.id);
    });

    it('returns the existing Tag matching case-insensitively', async () => {
      const result = await tagsService.findOrCreate('REMOTE');

      expect(result.id).toBe(remote.id);
    });

    it('creates a new Tag when none exists with the given name', async () => {
      const result = await tagsService.findOrCreate('Urgent');

      expect(result.name).toBe('Urgent');

      const saved = await tagRepository.findById(result.id);
      expect(saved?.id).toBe(result.id);
    });
  });

  describe('findById', () => {
    it('returns the Tag matching the given id', async () => {
      const result = await tagsService.findById(remote.id);

      expect(result?.id).toBe(remote.id);
    });

    it('returns null when no Tag matches the given id', async () => {
      const result = await tagsService.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('renames a Tag and returns the updated Tag', async () => {
      const result = await tagsService.update(remote.id, 'Remote Friendly');

      expect(result.id).toBe(remote.id);
      expect(result.name).toBe('Remote Friendly');

      const saved = await tagRepository.findById(remote.id);
      expect(saved?.name).toBe('Remote Friendly');
    });

    it('throws a NotFoundException when the given id does not match any existing Tag', async () => {
      await expect(
        tagsService.update('nonexistent-id', 'New Name'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws a ConflictException when renaming to a name that collides with a different Tag', async () => {
      await expect(tagsService.update(dreamJob.id, 'Remote')).rejects.toThrow(
        ConflictException,
      );
    });

    it('does not throw when renaming a Tag to its own current name', async () => {
      await expect(
        tagsService.update(remote.id, 'Remote'),
      ).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      for (let i = 0; i < 15; i++) {
        await tagRepository.save(Tag.create({ name: `Widget Tag ${i}` }));
      }
    });

    it('returns Tags whose name matches the given query', async () => {
      const results = await tagsService.search('remote');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(remote.id);
    });

    it('returns an empty array when no Tag matches the query', async () => {
      const results = await tagsService.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('limits results to at most 10 tags', async () => {
      const results = await tagsService.search('widget');

      expect(results).toHaveLength(10);
    });
  });

  describe('findPopular', () => {
    it('returns Tags from the repository, capped at the given limit', async () => {
      const results = await tagsService.findPopular(1);

      expect(results).toHaveLength(1);
    });
  });
});
