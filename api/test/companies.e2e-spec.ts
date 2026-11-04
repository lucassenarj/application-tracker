import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeEmailSender } from '../src/identity/test-utils/fakes/email-sender.fake';

const COMPANIES_E2E_TEST_EMAIL = 'companies-e2e-test@example.com';

describe('Companies (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let csrfToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
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

    ({ agent, csrfToken } = await authenticatedAgent());
  });

  afterAll(async () => {
    await cleanupTestData();

    await app.close();
  });

  async function cleanupTestData() {
    await prisma.company.deleteMany({
      where: { name: { startsWith: 'Companies E2e Test Co' } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: COMPANIES_E2E_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: COMPANIES_E2E_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({
      where: { email: COMPANIES_E2E_TEST_EMAIL },
    });
  }

  async function authenticatedAgent() {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: COMPANIES_E2E_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: COMPANIES_E2E_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: COMPANIES_E2E_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    return { agent, csrfToken };
  }

  it('creates a Company', async () => {
    const response = await agent
      .post('/companies')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Companies E2e Test Co Create' })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Companies E2e Test Co Create',
    });
  });

  it('rejects creating a Company without a CSRF token', async () => {
    await agent
      .post('/companies')
      .send({ name: 'Companies E2e Test Co No Csrf' })
      .expect(403);
  });

  it('renames a Company', async () => {
    const createResponse = await agent
      .post('/companies')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Companies E2e Test Co Rename Source' })
      .expect(201);

    const companyId = (createResponse.body as { id: string }).id;

    const updateResponse = await agent
      .patch(`/companies/${companyId}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Companies E2e Test Co Renamed' })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: companyId,
      name: 'Companies E2e Test Co Renamed',
    });
  });

  it('rejects renaming a Company without a CSRF token', async () => {
    const createResponse = await agent
      .post('/companies')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Companies E2e Test Co Rename Reject Source' })
      .expect(201);

    const companyId = (createResponse.body as { id: string }).id;

    await agent
      .patch(`/companies/${companyId}`)
      .send({ name: 'Companies E2e Test Co Renamed' })
      .expect(403);
  });
});
