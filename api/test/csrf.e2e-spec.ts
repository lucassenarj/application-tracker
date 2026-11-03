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

const CSRF_TEST_EMAIL = 'csrf-test@example.com';
const CSRF_TEST_2_EMAIL = 'csrf-test-2@example.com';
const CSRF_TEST_REFRESH_EMAIL = 'csrf-test-refresh@example.com';
const CSRF_TEST_PASSWORD_EMAIL = 'csrf-test-password@example.com';
const CSRF_TEST_EMAILS = [
  CSRF_TEST_EMAIL,
  CSRF_TEST_2_EMAIL,
  CSRF_TEST_REFRESH_EMAIL,
  CSRF_TEST_PASSWORD_EMAIL,
];

describe('CSRF protection (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getOptionsToken())
      .useValue([])
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
  });

  afterAll(async () => {
    await prisma.statusChange.deleteMany({
      where: { application: { title: 'CSRF Test Application' } },
    });
    await prisma.application.deleteMany({
      where: { title: 'CSRF Test Application' },
    });
    await prisma.company.deleteMany({ where: { name: 'CSRF Test Co' } });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: { in: CSRF_TEST_EMAILS } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: CSRF_TEST_EMAILS } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: CSRF_TEST_EMAILS } },
    });
    await app.close();
  });

  it('rejects a protected request with no CSRF token', async () => {
    await request(app.getHttpServer())
      .post('/applications')
      .send({ title: 'CSRF Test Application', companyName: 'CSRF Test Co' })
      .expect(403);
  });

  it('rejects a protected request with an invalid CSRF token', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.get('/auth/csrf-token');

    await agent
      .post('/applications')
      .set('x-csrf-token', 'invalid-token')
      .send({ title: 'CSRF Test Application', companyName: 'CSRF Test Co' })
      .expect(403);
  });
  it('accepts a protected request with a valid CSRF token', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: CSRF_TEST_2_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: CSRF_TEST_2_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: CSRF_TEST_2_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .post('/applications')
      .set('x-csrf-token', csrfToken)
      .send({ title: 'CSRF Test Application', companyName: 'CSRF Test Co' })
      .expect(201);
  });
  it('accepts a valid CSRF token when refreshing the access token', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: CSRF_TEST_REFRESH_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: CSRF_TEST_REFRESH_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: CSRF_TEST_REFRESH_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .post('/auth/refresh')
      .set('x-csrf-token', csrfToken)
      .expect(201);
  });
  it('rejects a password-change request with no CSRF token', async () => {
    await request(app.getHttpServer())
      .patch('/auth/password')
      .send({
        currentPassword: 'plain-text-password',
        newPassword: 'new-plain-text-password',
        revokeOtherSessions: false,
      })
      .expect(403);
  });
  it('accepts a password-change request with a valid CSRF token', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: CSRF_TEST_PASSWORD_EMAIL,
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await prisma.user.update({
      where: { email: CSRF_TEST_PASSWORD_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: CSRF_TEST_PASSWORD_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    await agent
      .patch('/auth/password')
      .set('x-csrf-token', csrfToken)
      .send({
        currentPassword: 'plain-text-password',
        newPassword: 'new-plain-text-password',
        revokeOtherSessions: false,
      })
      .expect(200);
  });
  it('allows an unprotected request without any CSRF token', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: CSRF_TEST_EMAIL,
        password: 'plain-text-password',
        name: 'E2E Test User',
      })
      .expect(201);
  });
});
