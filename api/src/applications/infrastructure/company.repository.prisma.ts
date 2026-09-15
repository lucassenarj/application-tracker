import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '../domain/company';
import type { CompanyRepository } from '../domain/company.repository';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(company: Company): Promise<void> {
    await this.prisma.company.upsert({
      where: { name: company.name },
      update: { website: company.website },
      create: {
        id: company.id,
        name: company.name,
        website: company.website,
      },
    });
  }

  async findByNormalizedName(name: string): Promise<Company | null> {
    const row = await this.prisma.company.findUnique({ where: { name } });

    if (!row) {
      return null;
    }

    return Company.reconstitute({
      id: row.id,
      name: row.name,
      website: row.website ?? undefined,
    });
  }

  search(): Promise<Company[]> {
    throw new Error('Not implemented');
  }
}
