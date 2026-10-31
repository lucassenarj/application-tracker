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

describe('Tags (e2e)', () => {
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

    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();

    await app.close();
  });

  async function cleanupTestData() {
    await prisma.tag.deleteMany({
      where: { name: { startsWith: 'Tags E2e Test Tag' } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: 'tags-e2e-test@example.com' } },
    });
    await prisma.user.deleteMany({
      where: { email: 'tags-e2e-test@example.com' },
    });
  }

  async function authenticatedAgent() {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/register').send({
      email: 'tags-e2e-test@example.com',
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await agent.post('/auth/login').send({
      email: 'tags-e2e-test@example.com',
      password: 'plain-text-password',
    });

    const csrfResponse = await agent.get('/auth/csrf-token');
    const csrfToken = (csrfResponse.body as { csrfToken: string }).csrfToken;

    return { agent, csrfToken };
  }

  it('creates a Tag', async () => {
    const { agent, csrfToken } = await authenticatedAgent();

    const response = await agent
      .post('/tags')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Tags E2e Test Tag Create' })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Tags E2e Test Tag Create',
    });
  });

  it('rejects creating a Tag without a CSRF token', async () => {
    const { agent } = await authenticatedAgent();

    await agent
      .post('/tags')
      .send({ name: 'Tags E2e Test Tag No Csrf' })
      .expect(403);
  });

  it('renames a Tag', async () => {
    const { agent, csrfToken } = await authenticatedAgent();

    const createResponse = await agent
      .post('/tags')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Tags E2e Test Tag Rename Source' })
      .expect(201);

    const tagId = (createResponse.body as { id: string }).id;

    const updateResponse = await agent
      .patch(`/tags/${tagId}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Tags E2e Test Tag Renamed' })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: tagId,
      name: 'Tags E2e Test Tag Renamed',
    });
  });

  it('rejects renaming a Tag without a CSRF token', async () => {
    const { agent, csrfToken } = await authenticatedAgent();

    const createResponse = await agent
      .post('/tags')
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Tags E2e Test Tag Rename Reject Source' })
      .expect(201);

    const tagId = (createResponse.body as { id: string }).id;

    await agent
      .patch(`/tags/${tagId}`)
      .send({ name: 'Tags E2e Test Tag Renamed' })
      .expect(403);
  });

  it('returns popular tags when no query is given', async () => {
    const { agent } = await authenticatedAgent();

    const response = await agent.get('/tags/search').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
