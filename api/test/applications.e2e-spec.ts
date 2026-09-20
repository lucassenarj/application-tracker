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

describe('Applications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
      where: { application: { title: 'Stats E2E Test Application' } },
    });
    await prisma.application.deleteMany({
      where: { title: 'Stats E2E Test Application' },
    });
    await prisma.company.deleteMany({ where: { name: 'Stats E2E Test Co' } });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: 'stats-e2e-test@example.com' } },
    });
    await prisma.user.deleteMany({
      where: { email: 'stats-e2e-test@example.com' },
    });
    await app.close();
  });

  it('returns application stats for the authenticated user, not confused with the :id route', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: 'stats-e2e-test@example.com',
      password: 'plain-text-password',
    });
    await agent.post('/auth/login').send({
      email: 'stats-e2e-test@example.com',
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
});
