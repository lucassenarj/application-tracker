import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Application } from '../domain/application';
import type { ApplicationRepository } from '../domain/application.repository';
import { Contact, StatusChange } from '../domain/status-change';

type PersistedStatusChange = {
  id: string;
  applicationId: string;
  status: string;
  eventDate: Date;
  notes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  interviewCategory: string | null;
  createdAt: Date;
};

type PersistedApplication = {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  salary: number | null;
  companyId: string;
  userId: string;
  currentStatus: string;
  statusChanges: PersistedStatusChange[];
  createdAt: Date;
};

@Injectable()
export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(application: Application): Promise<void> {
    await this.prisma.application.upsert({
      where: { id: application.id },
      update: { currentStatus: application.currentStatus },
      create: {
        id: application.id,
        title: application.title,
        description: application.description,
        externalUrl: application.externalUrl,
        salary: application.salary,
        companyId: application.companyId,
        userId: application.userId,
        currentStatus: application.currentStatus,
        createdAt: application.createdAt,
      },
    });

    await this.prisma.statusChange.createMany({
      data: application.statusHistory.map((statusChange) => ({
        id: statusChange.id,
        applicationId: statusChange.applicationId,
        status: statusChange.status,
        eventDate: statusChange.eventDate,
        notes: statusChange.notes,
        contactName: statusChange.contact?.name,
        contactEmail: statusChange.contact?.email,
        interviewCategory: statusChange.interviewCategory,
        createdAt: statusChange.createdAt,
      })),
      skipDuplicates: true,
    });
  }

  async findById(id: string): Promise<Application | null> {
    const row = await this.prisma.application.findUnique({
      where: { id },
      include: { statusChanges: { orderBy: { createdAt: 'asc' } } },
    });

    return row ? toApplication(row) : null;
  }

  async findAllByUser(userId: string): Promise<Application[]> {
    const rows = await this.prisma.application.findMany({
      where: { userId },
      include: { statusChanges: { orderBy: { createdAt: 'asc' } } },
    });

    return rows.map(toApplication);
  }
}

function toApplication(row: PersistedApplication): Application {
  return Application.reconstitute({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    externalUrl: row.externalUrl ?? undefined,
    salary: row.salary ?? undefined,
    companyId: row.companyId,
    userId: row.userId,
    currentStatus: row.currentStatus as Application['currentStatus'],
    statusHistory: row.statusChanges.map(toStatusChange),
    createdAt: row.createdAt,
  });
}

function toStatusChange(row: PersistedStatusChange): StatusChange {
  let contact: Contact | undefined;
  if (row.contactName || row.contactEmail) {
    contact = {
      name: row.contactName ?? '',
      email: row.contactEmail ?? '',
    };
  }

  return StatusChange.reconstitute({
    id: row.id,
    applicationId: row.applicationId,
    status: row.status as StatusChange['status'],
    eventDate: row.eventDate,
    notes: row.notes ?? undefined,
    contact,
    interviewCategory:
      (row.interviewCategory as StatusChange['interviewCategory']) ?? undefined,
    createdAt: row.createdAt,
  });
}
