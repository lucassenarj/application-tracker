import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getOptionsToken } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeEmailSender } from '../src/identity/test-utils/fakes/email-sender.fake';

const STATS_E2E_TEST_EMAIL = 'stats-e2e-test@example.com';
const RECENT_ACTIVITY_E2E_TEST_EMAIL = 'recent-activity-e2e-test@example.com';
const OVER_TIME_E2E_TEST_EMAIL = 'over-time-e2e-test@example.com';
const UPCOMING_INTERVIEWS_E2E_TEST_EMAIL =
  'upcoming-interviews-e2e-test@example.com';
const INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL =
  'interviews-by-month-e2e-test@example.com';
const TAG_FILTER_E2E_TEST_EMAIL = 'tag-filter-e2e-test@example.com';

describe('Applications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getOptionsToken())
      .useValue([])
      .overrideProvider('EmailSender')
      .useClass(FakeEmailSender)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.use(cookieParser());
    await app.init();

    prisma = app.get(PrismaService);

    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();

    await app.close();
  });

  async function cleanupTestData() {
    await prisma.statusChange.deleteMany({
      where: { application: { title: 'Stats E2E Test Application' } },
    });
    await prisma.application.deleteMany({
      where: { title: 'Stats E2E Test Application' },
    });
    await prisma.company.deleteMany({ where: { name: 'Stats E2e Test Co' } });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: STATS_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: STATS_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: STATS_E2E_TEST_EMAIL },
    });

    await prisma.statusChange.deleteMany({
      where: {
        application: { title: 'Recent Activity E2E Test Application' },
      },
    });
    await prisma.application.deleteMany({
      where: { title: 'Recent Activity E2E Test Application' },
    });
    await prisma.company.deleteMany({
      where: { name: 'Recent Activity E2e Test Co' },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: RECENT_ACTIVITY_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: RECENT_ACTIVITY_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: RECENT_ACTIVITY_E2E_TEST_EMAIL },
    });

    await prisma.statusChange.deleteMany({
      where: {
        application: { title: 'Over Time E2E Test Application' },
      },
    });
    await prisma.application.deleteMany({
      where: { title: 'Over Time E2E Test Application' },
    });
    await prisma.company.deleteMany({
      where: { name: 'Over Time E2e Test Co' },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: OVER_TIME_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: OVER_TIME_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: OVER_TIME_E2E_TEST_EMAIL },
    });

    await prisma.statusChange.deleteMany({
      where: {
        application: {
          title: 'Upcoming Interviews E2E Test Application',
        },
      },
    });
    await prisma.application.deleteMany({
      where: { title: 'Upcoming Interviews E2E Test Application' },
    });
    await prisma.company.deleteMany({
      where: { name: 'Upcoming Interviews E2e Test Co' },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: UPCOMING_INTERVIEWS_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: UPCOMING_INTERVIEWS_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: UPCOMING_INTERVIEWS_E2E_TEST_EMAIL },
    });

    await prisma.statusChange.deleteMany({
      where: {
        application: { title: 'Interviews By Month E2E Test Application' },
      },
    });
    await prisma.application.deleteMany({
      where: { title: 'Interviews By Month E2E Test Application' },
    });
    await prisma.company.deleteMany({
      where: { name: 'Interviews By Month E2e Test Co' },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL },
    });

    await prisma.statusChange.deleteMany({
      where: {
        application: { title: 'Tag Filter E2E Test Application' },
      },
    });
    await prisma.application.deleteMany({
      where: { title: 'Tag Filter E2E Test Application' },
    });
    await prisma.company.deleteMany({
      where: { name: 'Tag Filter E2E Test Co' },
    });
    await prisma.tag.deleteMany({
      where: { name: 'Tag Filter E2e Test Remote' },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: TAG_FILTER_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: TAG_FILTER_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: TAG_FILTER_E2E_TEST_EMAIL },
    });
  }

  it('returns application stats for the authenticated user, not confused with the :id route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: STATS_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: STATS_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: STATS_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Stats E2E Test Application',
        companyName: 'Stats E2E Test Co',
      })
      .expect(201);

    const response = await agent.get('/applications/stats').expect(200);

    expect(response.body).toEqual({
      total: 1,
      inProgress: 1,
      offers: 0,
      rejections: 0,
    });
  });

  it('returns recent activity for the authenticated user, not confused with the :id route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: RECENT_ACTIVITY_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: RECENT_ACTIVITY_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: RECENT_ACTIVITY_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Recent Activity E2E Test Application',
        companyName: 'Recent Activity E2E Test Co',
      })
      .expect(201);

    const response = await agent
      .get('/applications/recent-activity')
      .expect(200);

    const body = response.body as Array<{
      applicationTitle: string;
      companyName: string;
      status: string;
    }>;

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      applicationTitle: 'Recent Activity E2E Test Application',
      // Company.normalizeName title-cases each word; "E2E" has no internal
      // word boundary, so only its first letter gets capitalized.
      companyName: 'Recent Activity E2e Test Co',
      status: 'APPLIED',
    });
  });

  it('returns applications-over-time buckets for the authenticated user, not confused with the :id route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: OVER_TIME_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: OVER_TIME_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: OVER_TIME_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Over Time E2E Test Application',
        companyName: 'Over Time E2E Test Co',
      })
      .expect(201);

    const response = await agent.get('/applications/over-time').expect(200);

    const body = response.body as Array<{ weekStart: string; count: number }>;

    expect(body).toHaveLength(12);
    expect(body.reduce((sum, b) => sum + b.count, 0)).toBe(1);
  });

  it('returns upcoming interviews for the authenticated user', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: UPCOMING_INTERVIEWS_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: UPCOMING_INTERVIEWS_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: UPCOMING_INTERVIEWS_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    const createResponse = await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Upcoming Interviews E2E Test Application',
        companyName: 'Upcoming Interviews E2E Test Co',
      })
      .expect(201);

    const applicationId = (createResponse.body as { id: string }).id;

    await agent
      .patch(`/applications/${applicationId}/status`)
      .set('x-csrf-token', csrfToken)
      .send({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interviewCategory: 'TECHNICAL',
      })
      .expect(200);

    const response = await agent
      .get('/applications/interviews/upcoming')
      .expect(200);

    const body = response.body as Array<{
      applicationTitle: string;
      companyName: string;
      interviewCategory: string;
    }>;

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      applicationTitle: 'Upcoming Interviews E2E Test Application',
      companyName: 'Upcoming Interviews E2e Test Co',
      interviewCategory: 'TECHNICAL',
    });
  });

  it('returns interviews within the given month, including past ones, for the authenticated user', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: INTERVIEWS_BY_MONTH_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    const createResponse = await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Interviews By Month E2E Test Application',
        companyName: 'Interviews By Month E2E Test Co',
      })
      .expect(201);

    const applicationId = (createResponse.body as { id: string }).id;

    await agent
      .patch(`/applications/${applicationId}/status`)
      .set('x-csrf-token', csrfToken)
      .send({
        status: 'INTERVIEW_SCHEDULED',
        eventDate: new Date(2020, 0, 15).toISOString(),
        interviewCategory: 'TECHNICAL',
      })
      .expect(200);

    const response = await agent
      .get('/applications/interviews?year=2020&month=1')
      .expect(200);

    const body = response.body as Array<{
      applicationTitle: string;
      companyName: string;
      interviewCategory: string;
    }>;

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      applicationTitle: 'Interviews By Month E2E Test Application',
      companyName: 'Interviews By Month E2e Test Co',
      interviewCategory: 'TECHNICAL',
    });
  });

  it('filters applications by a single tag given in the query string', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: TAG_FILTER_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: TAG_FILTER_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: TAG_FILTER_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Tag Filter E2E Test Application',
        companyName: 'Tag Filter E2E Test Co',
        tagNames: ['Tag Filter E2e Test Remote'],
      })
      .expect(201);

    const response = await agent
      .get('/applications')
      .query({ page: 1, pageSize: 10, tags: 'Tag Filter E2e Test Remote' })
      .expect(200);

    const body = response.body as { items: Array<{ title: string }> };

    expect(body.items).toHaveLength(1);
    expect(body.items[0].title).toBe('Tag Filter E2E Test Application');
  });
});
