import { Tag } from './tag';

describe('Tag', () => {
  let tag: Tag;

  beforeAll(() => {
    tag = Tag.create({ name: 'Remote' });
  });

  describe('create', () => {
    it('creates a Tag with a valid name and exposes it back', () => {
      expect(tag.name).toBe('Remote');
    });

    it('normalizes name on creation (lowercase, then capitalize first letter of each word)', () => {
      const normalized = Tag.create({ name: 'REMOTE FRIENDLY' });

      expect(normalized.name).toBe('Remote Friendly');
    });

    it('throws an error when name is missing', () => {
      expect(() => Tag.create({ name: '' })).toThrow();
    });

    it('generates id on creation', () => {
      const firstTag = Tag.create({ name: 'Remote' });
      const secondTag = Tag.create({ name: 'Remote' });

      expect(firstTag.id).toEqual(expect.any(String));
      expect(firstTag.id).not.toBe('');
      expect(firstTag.id).not.toBe(secondTag.id);
    });
  });

  describe('reconstitute', () => {
    it('reconstitutes a Tag from persisted values without regenerating id or re-normalizing name', () => {
      const reconstituted = Tag.reconstitute({
        id: 'existing-id',
        name: 'Remote',
      });

      expect(reconstituted.id).toBe('existing-id');
      expect(reconstituted.name).toBe('Remote');
    });
  });

  describe('normalizeName', () => {
    it('exposes normalizeName so callers can normalize a name the same way before searching', () => {
      expect(Tag.normalizeName('REMOTE FRIENDLY')).toBe('Remote Friendly');
    });
  });

  describe('rename', () => {
    it('returns a new Tag with the normalized new name, keeping the same id', () => {
      const renamed = tag.rename('REMOTE FRIENDLY');

      expect(renamed.id).toBe(tag.id);
      expect(renamed.name).toBe('Remote Friendly');
    });
  });
});
