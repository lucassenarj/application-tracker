import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
  ],
})
export class IdentityModule {}
