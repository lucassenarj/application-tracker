import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { Tag } from './domain/tag';
import { FakeTagRepository } from './test-utils/fakes/tag.repository.fake';

describe('TagsController', () => {
  let tagsController: TagsController;
  let tagsService: TagsService;
  let remote: Tag;

  beforeEach(async () => {
    const tagRepository = new FakeTagRepository();
    tagsService = new TagsService(tagRepository);
    tagsController = new TagsController(tagsService);

    remote = await tagsService.create('Remote');
  });

  describe('search', () => {
    it('returns Tags matching the query', async () => {
      const results = await tagsController.search({ q: 'remote' });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(remote.id);
    });

    it('returns an empty array when no Tag matches the query', async () => {
      const results = await tagsController.search({ q: 'nonexistent' });

      expect(results).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates a Tag and returns it', async () => {
      const result = await tagsController.create({ name: 'Dream Job' });

      expect(result.name).toBe('Dream Job');
      expect(result.id).toEqual(expect.any(String));
    });

    it('throws a ConflictException when a Tag with the given name already exists', async () => {
      await expect(tagsController.create({ name: 'Remote' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('renames a Tag and returns the updated Tag', async () => {
      const result = await tagsController.update(remote.id, {
        name: 'Remote Friendly',
      });

      expect(result.id).toBe(remote.id);
      expect(result.name).toBe('Remote Friendly');
    });

    it('throws a NotFoundException when the given id does not match any existing Tag', async () => {
      await expect(
        tagsController.update('nonexistent-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
