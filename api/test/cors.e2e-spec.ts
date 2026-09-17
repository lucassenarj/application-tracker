import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows the configured frontend origin with credentials', async () => {
    expect(process.env.FRONTEND_URL).toBeTruthy();

    const response = await request(app.getHttpServer())
      .options('/auth/csrf-token')
      .set('Origin', process.env.FRONTEND_URL ?? '')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).toBe(
      process.env.FRONTEND_URL,
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
