import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tag } from './domain/tag';
import type { TagRepository } from './domain/tag.repository';

@Injectable()
export class TagsService {
  constructor(
    @Inject('TagRepository')
    private readonly tagRepository: TagRepository,
  ) {}

  search(query: string): Promise<Tag[]> {
    return this.tagRepository.search(query);
  }

  findPopular(limit: number): Promise<Tag[]> {
    return this.tagRepository.findPopular(limit);
  }

  async create(name: string): Promise<Tag> {
    const normalizedName = Tag.normalizeName(name);
    const existing =
      await this.tagRepository.findByNormalizedName(normalizedName);
    if (existing) {
      throw new ConflictException('a Tag with this name already exists');
    }
    const tag = Tag.create({ name });
    await this.tagRepository.save(tag);
    return tag;
  }

  async findOrCreate(name: string): Promise<Tag> {
    const normalizedName = Tag.normalizeName(name);
    const existing =
      await this.tagRepository.findByNormalizedName(normalizedName);
    if (existing) return existing;
    return this.create(name);
  }

  findById(id: string): Promise<Tag | null> {
    return this.tagRepository.findById(id);
  }

  async update(id: string, name: string): Promise<Tag> {
    const existing = await this.tagRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }
    const normalizedName = Tag.normalizeName(name);
    const collision =
      await this.tagRepository.findByNormalizedName(normalizedName);
    if (collision && collision.id !== id) {
      throw new ConflictException('a Tag with this name already exists');
    }
    const renamed = existing.rename(name);
    await this.tagRepository.save(renamed);
    return renamed;
  }
}
