import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '../domain/company';
import type { CompanyRepository } from '../domain/company.repository';
import { toPrefixTsQuery } from '../../utils/postgres-search';

type PersistedCompany = {
  id: string;
  name: string;
  website: string | null;
};

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(company: Company): Promise<void> {
    await this.prisma.company.upsert({
      where: { id: company.id },
      update: { name: company.name, website: company.website },
      create: {
        id: company.id,
        name: company.name,
        website: company.website,
      },
    });
  }

  async findByNormalizedName(name: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({ where: { name } });

    return row ? toCompany(row) : null;
  }

  async findById(id: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({ where: { id } });

    return row ? toCompany(row) : null;
  }

  async search(query: string): Promise<Company[]> {
    const searchQuery = toPrefixTsQuery(query);

    if (!searchQuery) {
      return [];
    }

    const rows = await this.prisma.company.findMany({
      where: { name: { search: searchQuery } },
      take: 10,
    });

    return rows.map(toCompany);
  }
}

function toCompany(row: PersistedCompany): Company {
  return Company.reconstitute({
    id: row.id,
    name: row.name,
    website: row.website ?? undefined,
  });
}
