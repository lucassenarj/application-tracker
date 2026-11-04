import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeEmailSender } from '../src/identity/test-utils/fakes/email-sender.fake';

describe('Rate limiting (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('EmailSender')
      .useClass(FakeEmailSender)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', 1);
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
    await prisma.emailVerificationToken.deleteMany({
      where: { user: { email: { contains: 'rate-limit' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'rate-limit' } },
    });
    await app.close();
  });

  it('blocks the 3rd login request within a minute from the same IP', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({
      email: 'rate-limit-login-1@example.com',
      password: 'wrong-password',
    });
    await request(app.getHttpServer()).post('/auth/login').send({
      email: 'rate-limit-login-2@example.com',
      password: 'wrong-password',
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'rate-limit-login-3@example.com',
        password: 'wrong-password',
      })
      .expect(429);
  });

  it('configures the hourly tier with a limit of 5 on the register endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Forwarded-For', '203.0.113.30')
      .send({
        email: 'rate-limit-hourly-config@example.com',
        password: 'plain-text-password',
        name: 'E2E Test User',
      });

    expect(response.headers['x-ratelimit-limit-hourly']).toBe('5');
  });

  it('blocks the 3rd register request within a minute from the same IP', async () => {
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'rate-limit-register-1@example.com',
      password: 'plain-text-password',
      name: 'E2E Test User',
    });
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'rate-limit-register-2@example.com',
      password: 'plain-text-password',
      name: 'E2E Test User',
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'rate-limit-register-3@example.com',
        password: 'plain-text-password',
        name: 'E2E Test User',
      })
      .expect(429);
  });

  it('does not limit reset-password beyond the general default', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'nonexistent-token',
          newPassword: 'new-plain-text-password',
        })
        .expect(401);
    }
  });

  it('scopes the limit per IP, not globally across all callers', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({
        email: 'rate-limit-ip-a-1@example.com',
        password: 'wrong-password',
      });
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '203.0.113.10')
      .send({
        email: 'rate-limit-ip-a-2@example.com',
        password: 'wrong-password',
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '203.0.113.20')
      .send({
        email: 'rate-limit-ip-b-1@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });
});
