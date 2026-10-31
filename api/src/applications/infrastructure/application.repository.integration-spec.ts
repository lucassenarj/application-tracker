import { PrismaService } from '../../prisma/prisma.service';
import { Company } from '../../companies/domain/company';
import { PrismaCompanyRepository } from '../../companies/infrastructure/company.repository.prisma';
import { Tag } from '../../tags/domain/tag';
import { PrismaTagRepository } from '../../tags/infrastructure/tag.repository.prisma';
import { Application } from '../domain/application';
import { PrismaApplicationRepository } from './application.repository.prisma';

describe('PrismaApplicationRepository', () => {
  let prisma: PrismaService;
  let applicationRepository: PrismaApplicationRepository;
  let companyRepository: PrismaCompanyRepository;
  let tagRepository: PrismaTagRepository;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    applicationRepository = new PrismaApplicationRepository(prisma);
    companyRepository = new PrismaCompanyRepository(prisma);
    tagRepository = new PrismaTagRepository(prisma);
  });

  afterAll(async () => {
    await prisma.statusChange.deleteMany({
      where: {
        application: { company: { name: { in: ['Acme Corp', 'Globex Inc'] } } },
      },
    });
    await prisma.application.deleteMany({
      where: { company: { name: { in: ['Acme Corp', 'Globex Inc'] } } },
    });
    await prisma.company.deleteMany({
      where: { name: { in: ['Acme Corp', 'Globex Inc'] } },
    });
    await prisma.tag.deleteMany({
      where: { name: { startsWith: 'App Tag Test' } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.statusChange.deleteMany({
      where: {
        application: { company: { name: { in: ['Acme Corp', 'Globex Inc'] } } },
      },
    });
    await prisma.application.deleteMany({
      where: { company: { name: { in: ['Acme Corp', 'Globex Inc'] } } },
    });
    await prisma.company.deleteMany({
      where: { name: { in: ['Acme Corp', 'Globex Inc'] } },
    });
    await prisma.tag.deleteMany({
      where: { name: { startsWith: 'App Tag Test' } },
    });
  });

  describe('save', () => {
    it('saves an Application with its initial StatusChange and finds it back by id', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const foundApplication = await applicationRepository.findById(
        application.id,
      );

      expect(foundApplication?.id).toBe(application.id);
      expect(foundApplication?.currentStatus).toBe('APPLIED');
      expect(foundApplication?.statusHistory).toHaveLength(1);
      expect(foundApplication?.statusHistory[0].status).toBe('APPLIED');
    });

    it('updates currentStatus and appends the new StatusChange on save, without duplicating the original one', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const updatedApplication = application.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedApplication);

      const foundApplication = await applicationRepository.findById(
        application.id,
      );

      expect(foundApplication?.currentStatus).toBe('WAITING_FEEDBACK');
      expect(foundApplication?.statusHistory).toHaveLength(2);
      expect(foundApplication?.statusHistory[0].status).toBe('APPLIED');
      expect(foundApplication?.statusHistory[1].status).toBe(
        'WAITING_FEEDBACK',
      );
    });

    it('persists optional fields (description, externalUrl, salary, currency) and returns them via findById', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        description: 'Great role',
        externalUrl: 'https://jobs.example/123',
        salary: 120000,
        currency: 'EUR',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const foundApplication = await applicationRepository.findById(
        application.id,
      );

      expect(foundApplication?.description).toBe('Great role');
      expect(foundApplication?.externalUrl).toBe('https://jobs.example/123');
      expect(foundApplication?.salary).toBe(120000);
      expect(foundApplication?.currency).toBe('EUR');
    });

    it('persists Contact and interviewCategory on a StatusChange and returns them via findById', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const updatedApplication = application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(),
        interviewCategory: 'TECHNICAL',
        contact: { name: 'Jane Recruiter', email: 'jane@example.com' },
      });
      await applicationRepository.save(updatedApplication);

      const foundApplication = await applicationRepository.findById(
        application.id,
      );
      const statusChange = foundApplication?.statusHistory[1];

      expect(statusChange?.interviewCategory).toBe('TECHNICAL');
      expect(statusChange?.contact).toEqual({
        name: 'Jane Recruiter',
        email: 'jane@example.com',
      });
    });

    it('persists tagIds and returns them via findById', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);
      const tag = Tag.create({ name: 'App Tag Test Remote' });
      await tagRepository.save(tag);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
        tagIds: [tag.id],
      });
      await applicationRepository.save(application);

      const foundApplication = await applicationRepository.findById(
        application.id,
      );

      expect(foundApplication?.tagIds).toEqual([tag.id]);
    });
  });

  describe('findById', () => {
    it('returns null when no Application matches the given id', async () => {
      const foundApplication =
        await applicationRepository.findById('nonexistent-id');

      expect(foundApplication).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('returns all Applications belonging to the given user', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const firstApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(firstApplication);

      const secondApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(secondApplication);

      const otherUserApplication = Application.create({
        title: 'Should not appear',
        companyId: company.id,
        userId: 'user-2',
      });
      await applicationRepository.save(otherUserApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((a) => a.application.id)).toEqual(
        expect.arrayContaining([firstApplication.id, secondApplication.id]),
      );
      expect(result.items.every((a) => a.companyName === 'Acme Corp')).toBe(
        true,
      );
    });

    it('returns Applications ordered by most recently created first', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const olderApplication = Application.create({
        title: 'Older Application',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(olderApplication);
      await prisma.application.update({
        where: { id: olderApplication.id },
        data: { createdAt: new Date('2026-01-01T00:00:00.000Z') },
      });

      const newerApplication = Application.create({
        title: 'Newer Application',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(newerApplication);
      await prisma.application.update({
        where: { id: newerApplication.id },
        data: { createdAt: new Date('2026-01-02T00:00:00.000Z') },
      });

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
      });

      expect(result.items[0].application.id).toBe(newerApplication.id);
      expect(result.items[1].application.id).toBe(olderApplication.id);
    });

    it('returns an empty result when the user has no Applications', async () => {
      const result = await applicationRepository.findAllByUser(
        'user-without-applications',
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns only the requested page, while total reflects all matching Applications', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      for (let i = 0; i < 3; i++) {
        const application = Application.create({
          title: `Application ${i}`,
          companyId: company.id,
          userId: 'user-1',
        });
        await applicationRepository.save(application);
      }

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 2,
        pageSize: 2,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(3);
    });

    it('returns Applications whose title matches the search term', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const matchingApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(matchingApplication);

      const nonMatchingApplication = Application.create({
        title: 'Frontend Developer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(nonMatchingApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'backend',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].application.id).toBe(matchingApplication.id);
    });
    it('returns Applications whose company name matches the search term', async () => {
      const acme = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(acme);
      const globex = Company.create({ name: 'Globex Inc' });
      await companyRepository.save(globex);

      const matchingApplication = Application.create({
        title: 'Software Engineer',
        companyId: acme.id,
        userId: 'user-1',
      });
      await applicationRepository.save(matchingApplication);

      const nonMatchingApplication = Application.create({
        title: 'Software Engineer',
        companyId: globex.id,
        userId: 'user-1',
      });
      await applicationRepository.save(nonMatchingApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'acme',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].application.id).toBe(matchingApplication.id);
    });
    it('matches on a partial/prefix word, for autocomplete-style typing', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const matchingApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(matchingApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'back',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].application.id).toBe(matchingApplication.id);
    });
    it('returns an empty result when neither title nor company name matches', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'nonexistent',
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns only Applications matching the given status', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const firstApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(firstApplication);

      const secondApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(secondApplication);

      const updatedFirstApplication = firstApplication.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedFirstApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        status: 'WAITING_FEEDBACK',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].application.id).toBe(firstApplication.id);
    });
    it('combines the status filter with the search filter', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const matchingApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(matchingApplication);
      const updatedMatchingApplication = matchingApplication.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedMatchingApplication);

      const wrongStatusApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(wrongStatusApplication);

      const wrongTitleApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(wrongTitleApplication);
      const updatedWrongTitleApplication = wrongTitleApplication.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedWrongTitleApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        search: 'backend',
        status: 'WAITING_FEEDBACK',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].application.id).toBe(matchingApplication.id);
    });

    it('returns only Applications matching the given category', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const inProgressApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(inProgressApplication);
      const updatedInProgressApplication = inProgressApplication.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedInProgressApplication);

      const offerApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(offerApplication);
      const updatedOfferApplication = offerApplication.changeStatus({
        status: 'OFFER',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedOfferApplication);

      const result = await applicationRepository.findAllByUser('user-1', {
        page: 1,
        pageSize: 10,
        category: 'IN_PROGRESS',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].application.id).toBe(inProgressApplication.id);
    });

    describe('tag filtering and hydration', () => {
      let company: Company;
      let tag: Tag;

      beforeEach(async () => {
        company = Company.create({ name: 'Acme Corp' });
        await companyRepository.save(company);
        tag = Tag.create({ name: 'App Tag Test Remote' });
        await tagRepository.save(tag);
      });

      it('returns hydrated tag names for each Application', async () => {
        const application = Application.create({
          title: 'Senior Backend Engineer',
          companyId: company.id,
          userId: 'user-1',
          tagIds: [tag.id],
        });
        await applicationRepository.save(application);

        const result = await applicationRepository.findAllByUser('user-1', {
          page: 1,
          pageSize: 10,
        });

        expect(result.items[0].tags).toEqual(['App Tag Test Remote']);
      });

      it('returns only Applications matching the given tag', async () => {
        const taggedApplication = Application.create({
          title: 'Senior Backend Engineer',
          companyId: company.id,
          userId: 'user-1',
          tagIds: [tag.id],
        });
        await applicationRepository.save(taggedApplication);

        const untaggedApplication = Application.create({
          title: 'Staff Engineer',
          companyId: company.id,
          userId: 'user-1',
        });
        await applicationRepository.save(untaggedApplication);

        const result = await applicationRepository.findAllByUser('user-1', {
          page: 1,
          pageSize: 10,
          tags: ['App Tag Test Remote'],
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].application.id).toBe(taggedApplication.id);
      });

      it('returns Applications matching any of multiple given tags', async () => {
        const otherTag = Tag.create({ name: 'App Tag Test Urgent' });
        await tagRepository.save(otherTag);

        const remoteApplication = Application.create({
          title: 'Senior Backend Engineer',
          companyId: company.id,
          userId: 'user-1',
          tagIds: [tag.id],
        });
        await applicationRepository.save(remoteApplication);

        const urgentApplication = Application.create({
          title: 'Staff Engineer',
          companyId: company.id,
          userId: 'user-1',
          tagIds: [otherTag.id],
        });
        await applicationRepository.save(urgentApplication);

        const untaggedApplication = Application.create({
          title: 'QA Engineer',
          companyId: company.id,
          userId: 'user-1',
        });
        await applicationRepository.save(untaggedApplication);

        const result = await applicationRepository.findAllByUser('user-1', {
          page: 1,
          pageSize: 10,
          tags: ['App Tag Test Remote', 'App Tag Test Urgent'],
        });

        expect(result.items).toHaveLength(2);
        expect(result.items.map((i) => i.application.id)).toEqual(
          expect.arrayContaining([remoteApplication.id, urgentApplication.id]),
        );
      });
    });
  });

  describe('countByUserGroupedByStatus', () => {
    it('returns a count of 0 for every status when the user has no Applications', async () => {
      const counts =
        await applicationRepository.countByUserGroupedByStatus('user-1');

      expect(counts).toEqual({
        APPLIED: 0,
        WAITING_FEEDBACK: 0,
        ASSIGNMENT: 0,
        INTERVIEW_SCHEDULED: 0,
        OFFER: 0,
        OFFER_ACCEPTED: 0,
        OFFER_DECLINED: 0,
        REJECTED: 0,
      });
    });
    it('returns the correct count for statuses that have Applications, and 0 for the rest', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const firstApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(firstApplication);

      const secondApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(secondApplication);

      const updatedSecondApplication = secondApplication.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(),
      });
      await applicationRepository.save(updatedSecondApplication);

      const counts =
        await applicationRepository.countByUserGroupedByStatus('user-1');

      expect(counts).toEqual({
        APPLIED: 1,
        WAITING_FEEDBACK: 1,
        ASSIGNMENT: 0,
        INTERVIEW_SCHEDULED: 0,
        OFFER: 0,
        OFFER_ACCEPTED: 0,
        OFFER_DECLINED: 0,
        REJECTED: 0,
      });
    });
    it('does not include Applications belonging to a different user', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const ownApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(ownApplication);

      const otherUserApplication = Application.create({
        title: 'Should not count',
        companyId: company.id,
        userId: 'user-2',
      });
      await applicationRepository.save(otherUserApplication);

      const counts =
        await applicationRepository.countByUserGroupedByStatus('user-1');

      expect(counts.APPLIED).toBe(1);
    });
  });

  describe('findRecentStatusChangesByUser', () => {
    it('returns the application title, company name, status, and event date for each status change', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const updatedApplication = application.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: oneHourAgo,
      });
      await applicationRepository.save(updatedApplication);

      const activity =
        await applicationRepository.findRecentStatusChangesByUser(
          'user-1',
          10,
          new Date(),
        );

      expect(activity).toHaveLength(2);
      expect(activity).toContainEqual(
        expect.objectContaining({
          applicationId: application.id,
          applicationTitle: 'Senior Backend Engineer',
          companyName: 'Acme Corp',
          status: 'WAITING_FEEDBACK',
          eventDate: oneHourAgo,
        }),
      );
    });

    it('orders items by most recent eventDate first', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const olderApplication = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(olderApplication);

      const newerApplication = Application.create({
        title: 'Staff Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(newerApplication);

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      await applicationRepository.save(
        olderApplication.changeStatus({
          status: 'WAITING_FEEDBACK',
          eventDate: twoHoursAgo,
        }),
      );
      await applicationRepository.save(
        newerApplication.changeStatus({
          status: 'WAITING_FEEDBACK',
          eventDate: oneHourAgo,
        }),
      );

      const activity =
        await applicationRepository.findRecentStatusChangesByUser(
          'user-1',
          10,
          new Date(),
        );

      const newerIndex = activity.findIndex(
        (item) =>
          item.applicationId === newerApplication.id &&
          item.status === 'WAITING_FEEDBACK',
      );
      const olderIndex = activity.findIndex(
        (item) =>
          item.applicationId === olderApplication.id &&
          item.status === 'WAITING_FEEDBACK',
      );

      expect(newerIndex).toBeLessThan(olderIndex);
    });

    it('excludes status changes with a future eventDate', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      const updatedApplication = application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        interviewCategory: 'TECHNICAL',
      });
      await applicationRepository.save(updatedApplication);

      const activity =
        await applicationRepository.findRecentStatusChangesByUser(
          'user-1',
          10,
          new Date(),
        );

      expect(activity).toHaveLength(1);
      expect(activity[0].status).toBe('APPLIED');
    });

    it('does not include status changes belonging to a different user', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const otherUserApplication = Application.create({
        title: 'Should not appear',
        companyId: company.id,
        userId: 'user-2',
      });
      await applicationRepository.save(otherUserApplication);

      const activity =
        await applicationRepository.findRecentStatusChangesByUser(
          'user-1',
          10,
          new Date(),
        );

      expect(activity).toEqual([]);
    });
  });

  describe('findCreatedDatesByUser', () => {
    it("returns the createdAt timestamps of the user's applications", async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const dates =
        await applicationRepository.findCreatedDatesByUser('user-1');

      expect(dates).toEqual([application.createdAt]);
    });

    it('does not include applications belonging to a different user', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const otherUserApplication = Application.create({
        title: 'Should not appear',
        companyId: company.id,
        userId: 'user-2',
      });
      await applicationRepository.save(otherUserApplication);

      const dates =
        await applicationRepository.findCreatedDatesByUser('user-1');

      expect(dates).toEqual([]);
    });
  });

  describe('findUpcomingInterviewsByUser', () => {
    it('returns scheduled interviews in the future, ordered by soonest first', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const updatedApplication = application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate,
        interviewCategory: 'TECHNICAL',
      });
      await applicationRepository.save(updatedApplication);

      const interviews =
        await applicationRepository.findUpcomingInterviewsByUser(
          'user-1',
          new Date(),
        );

      expect(interviews).toHaveLength(1);
      expect(interviews[0]).toMatchObject({
        applicationId: application.id,
        applicationTitle: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        eventDate,
        interviewCategory: 'TECHNICAL',
      });
    });

    it('does not include past interview dates or non-interview status changes', async () => {
      const company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      const application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);

      const updatedApplication = application.changeStatus({
        status: 'WAITING_FEEDBACK',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await applicationRepository.save(updatedApplication);

      const interviews =
        await applicationRepository.findUpcomingInterviewsByUser(
          'user-1',
          new Date(),
        );

      expect(interviews).toEqual([]);
    });
  });

  describe('findInterviewsByUserInRange', () => {
    let company: Company;
    let application: Application;

    beforeEach(async () => {
      company = Company.create({ name: 'Acme Corp' });
      await companyRepository.save(company);

      application = Application.create({
        title: 'Senior Backend Engineer',
        companyId: company.id,
        userId: 'user-1',
      });
      await applicationRepository.save(application);
    });

    it('includes interviews within the given range, regardless of past or future', async () => {
      const eventDate = new Date(2020, 0, 15);
      const updatedApplication = application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate,
        interviewCategory: 'TECHNICAL',
      });
      await applicationRepository.save(updatedApplication);

      const interviews =
        await applicationRepository.findInterviewsByUserInRange(
          'user-1',
          new Date(2020, 0, 1),
          new Date(2020, 1, 1),
        );

      expect(interviews).toHaveLength(1);
      expect(interviews[0]).toMatchObject({
        applicationId: application.id,
        applicationTitle: 'Senior Backend Engineer',
        companyName: 'Acme Corp',
        eventDate,
        interviewCategory: 'TECHNICAL',
      });
    });

    it('excludes interviews outside the given range', async () => {
      const updatedApplication = application.changeStatus({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(2020, 1, 1),
        interviewCategory: 'TECHNICAL',
      });
      await applicationRepository.save(updatedApplication);

      const interviews =
        await applicationRepository.findInterviewsByUserInRange(
          'user-1',
          new Date(2020, 0, 1),
          new Date(2020, 1, 1),
        );

      expect(interviews).toEqual([]);
    });
  });
});
