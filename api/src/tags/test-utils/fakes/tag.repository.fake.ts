import type { Tag } from '../../domain/tag';
import type { TagRepository } from '../../domain/tag.repository';

export class FakeTagRepository implements TagRepository {
  private readonly tags = new Map<string, Tag>();

  save(tag: Tag): Promise<void> {
    this.tags.set(tag.id, tag);
    return Promise.resolve();
  }

  findByNormalizedName(name: string): Promise<Tag | null> {
    return Promise.resolve(
      [...this.tags.values()].find((t) => t.name === name) ?? null,
    );
  }

  search(query: string): Promise<Tag[]> {
    const normalizedQuery = query.toLowerCase();

    const matching = [...this.tags.values()].filter((t) =>
      t.name.toLowerCase().includes(normalizedQuery),
    );

    return Promise.resolve(matching.slice(0, 10));
  }

  findById(id: string): Promise<Tag | null> {
    return Promise.resolve(this.tags.get(id) ?? null);
  }
}
