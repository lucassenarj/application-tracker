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

const EXTERNAL_TEST_EMAIL = 'external-api-test@example.com';
const EXTERNAL_TEST_COMPANY = 'External Test Co';

describe('External applications API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let rawToken: string;

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
  });

  beforeAll(async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: EXTERNAL_TEST_EMAIL,
      password: 'plain-text-password',
      name: 'External API Test User',
    });
    await prisma.user.update({
      where: { email: EXTERNAL_TEST_EMAIL },
      data: { emailVerifiedAt: new Date() },
    });
    await agent.post('/auth/login').send({
      email: EXTERNAL_TEST_EMAIL,
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    const tokenResponse = await agent
      .post('/auth/personal-access-tokens')
      .set('x-csrf-token', csrfToken)
      .send({ label: 'E2E test token' });

    rawToken = (tokenResponse.body as { token: string }).token;
  });

  afterAll(async () => {
    await prisma.statusChange.deleteMany({
      where: { application: { title: 'External Test Application' } },
    });
    await prisma.application.deleteMany({
      where: { title: 'External Test Application' },
    });
    await prisma.company.deleteMany({ where: { name: EXTERNAL_TEST_COMPANY } });
    await prisma.personalAccessToken.deleteMany({
      where: { user: { email: EXTERNAL_TEST_EMAIL } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: EXTERNAL_TEST_EMAIL } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: EXTERNAL_TEST_EMAIL } },
    });
    await prisma.user.deleteMany({ where: { email: EXTERNAL_TEST_EMAIL } });
    await app.close();
  });

  it('creates an Application when the token is valid', async () => {
    await request(app.getHttpServer())
      .post('/external/applications')
      .set('Authorization', `Bearer ${rawToken}`)
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: 'https://www.linkedin.com/jobs/view/external-test-1',
      })
      .expect(201);
  });

  it('returns 401 when no Authorization header is present', async () => {
    await request(app.getHttpServer())
      .post('/external/applications')
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: 'https://www.linkedin.com/jobs/view/external-test-no-auth',
      })
      .expect(401);
  });
  it('returns 401 when the token is unknown', async () => {
    await request(app.getHttpServer())
      .post('/external/applications')
      .set('Authorization', 'Bearer unknown-token')
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: 'https://www.linkedin.com/jobs/view/external-test-unknown',
      })
      .expect(401);
  });

  it('returns 401 when the token has been revoked', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/auth/login').send({
      email: EXTERNAL_TEST_EMAIL,
      password: 'plain-text-password',
    });
    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    const tokenResponse = await agent
      .post('/auth/personal-access-tokens')
      .set('x-csrf-token', csrfToken)
      .send({ label: 'Token to revoke' });
    const revokedRawToken = (tokenResponse.body as { token: string }).token;
    const revokedTokenId = (tokenResponse.body as { id: string }).id;

    await agent
      .delete(`/auth/personal-access-tokens/${revokedTokenId}`)
      .set('x-csrf-token', csrfToken);

    await request(app.getHttpServer())
      .post('/external/applications')
      .set('Authorization', `Bearer ${revokedRawToken}`)
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: 'https://www.linkedin.com/jobs/view/external-test-revoked',
      })
      .expect(401);
  });

  it('returns the existing Application instead of creating a duplicate when the same externalUrl is captured twice', async () => {
    const duplicateExternalUrl =
      'https://www.linkedin.com/jobs/view/external-test-duplicate';

    const firstResponse = await request(app.getHttpServer())
      .post('/external/applications')
      .set('Authorization', `Bearer ${rawToken}`)
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: duplicateExternalUrl,
      })
      .expect(201);

    const secondResponse = await request(app.getHttpServer())
      .post('/external/applications')
      .set('Authorization', `Bearer ${rawToken}`)
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: duplicateExternalUrl,
      })
      .expect(200);

    expect((secondResponse.body as { id: string }).id).toBe(
      (firstResponse.body as { id: string }).id,
    );
  });

  it('does not require a CSRF token', async () => {
    await request(app.getHttpServer())
      .post('/external/applications')
      .set('Authorization', `Bearer ${rawToken}`)
      .send({
        title: 'External Test Application',
        companyName: EXTERNAL_TEST_COMPANY,
        externalUrl: 'https://www.linkedin.com/jobs/view/external-test-no-csrf',
      })
      .expect(201);
  });
});
