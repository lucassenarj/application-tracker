import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Tag } from '../domain/tag';
import type { TagRepository } from '../domain/tag.repository';
import { toPrefixTsQuery } from '../../utils/postgres-search';

type PersistedTag = {
  id: string;
  name: string;
};

@Injectable()
export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(tag: Tag): Promise<void> {
    await this.prisma.tag.upsert({
      where: { id: tag.id },
      update: { name: tag.name },
      create: {
        id: tag.id,
        name: tag.name,
      },
    });
  }

  async findByNormalizedName(name: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { name } });

    return row ? toTag(row) : null;
  }

  async findById(id: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { id } });

    return row ? toTag(row) : null;
  }

  async search(query: string): Promise<Tag[]> {
    const searchQuery = toPrefixTsQuery(query);

    if (!searchQuery) {
      return [];
    }

    const rows = await this.prisma.tag.findMany({
      where: { name: { search: searchQuery } },
      take: 10,
    });

    return rows.map(toTag);
  }
}

function toTag(row: PersistedTag): Tag {
  return Tag.reconstitute({
    id: row.id,
    name: row.name,
  });
}
