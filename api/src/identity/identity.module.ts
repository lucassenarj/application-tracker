import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { doubleCsrfProtection } from '../csrf.config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ResendEmailSender } from './infrastructure/email-sender.resend';
import { PrismaEmailVerificationTokenRepository } from './infrastructure/email-verification-token.repository.prisma';
import { PrismaPasswordResetTokenRepository } from './infrastructure/password-reset-token.repository.prisma';
import { PrismaPersonalAccessTokenRepository } from './infrastructure/personal-access-token.repository.prisma';
import { Argon2PasswordHasher } from './infrastructure/password-hasher.argon2';
import { PrismaRefreshTokenRepository } from './infrastructure/refresh-token.repository.prisma';
import { PrismaUserRepository } from './infrastructure/user.repository.prisma';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    {
      provide: 'UserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'PasswordHasher',
      useClass: Argon2PasswordHasher,
    },
    {
      provide: 'RefreshTokenRepository',
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: 'PasswordResetTokenRepository',
      useClass: PrismaPasswordResetTokenRepository,
    },
    {
      provide: 'EmailVerificationTokenRepository',
      useClass: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: 'PersonalAccessTokenRepository',
      useClass: PrismaPersonalAccessTokenRepository,
    },
    {
      provide: 'EmailSender',
      useClass: ResendEmailSender,
    },
  ],
  exports: [JwtModule, 'PersonalAccessTokenRepository'],
})
export class IdentityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(doubleCsrfProtection).forRoutes(
      { path: 'auth/refresh', method: RequestMethod.POST },
      { path: 'auth/logout', method: RequestMethod.POST },
      { path: 'auth/me', method: RequestMethod.PATCH },
      { path: 'auth/password', method: RequestMethod.PATCH },
      { path: 'auth/personal-access-tokens', method: RequestMethod.POST },
      {
        path: 'auth/personal-access-tokens/:id',
        method: RequestMethod.DELETE,
      },
    );
  }
}
