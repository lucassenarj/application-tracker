import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { generateCsrfToken } from '../csrf.config';
import { AuthService, REFRESH_TOKEN_TTL_MS } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreatePersonalAccessTokenDto } from './dto/create-personal-access-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponse } from './dto/user-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  DEFAULT_THROTTLE_TTL_MS,
  FORGOT_PASSWORD_HOURLY_THROTTLE_LIMIT,
  FORGOT_PASSWORD_THROTTLE_LIMIT,
  HOURLY_THROTTLE_TTL_MS,
  LOGIN_THROTTLE_LIMIT,
  REGISTER_HOURLY_THROTTLE_LIMIT,
  REGISTER_THROTTLE_LIMIT,
} from '../throttle.config';

const isDev = process.env.NODE_ENV !== 'production';

@Controller('auth')
@SerializeOptions({ excludeExtraneousValues: true })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({
    default: { limit: REGISTER_THROTTLE_LIMIT, ttl: DEFAULT_THROTTLE_TTL_MS },
    hourly: {
      limit: REGISTER_HOURLY_THROTTLE_LIMIT,
      ttl: HOURLY_THROTTLE_TTL_MS,
    },
  })
  async register(@Body() dto: RegisterDto): Promise<UserResponse> {
    const user = await this.authService.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });

    return UserResponse.fromDomain(user);
  }

  @Post('login')
  @Throttle({
    default: { limit: LOGIN_THROTTLE_LIMIT, ttl: DEFAULT_THROTTLE_TTL_MS },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponse> {
    const loginResult = await this.authService.login({
      email: dto.email,
      password: dto.password,
      rememberMe: dto.rememberMe ?? false,
    });

    response.cookie('accessToken', loginResult.accessToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'strict',
    });

    response.cookie('refreshToken', loginResult.refreshToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'strict',
      path: '/auth/refresh',
      ...(loginResult.rememberMe ? { maxAge: REFRESH_TOKEN_TTL_MS } : {}),
    });

    return UserResponse.fromDomain(loginResult.user);
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const rawRefreshToken = request.cookies?.refreshToken as string | undefined;

    if (!rawRefreshToken) {
      throw new UnauthorizedException('missing refresh token');
    }

    const refreshResult = await this.authService.refresh(rawRefreshToken);

    response.cookie('accessToken', refreshResult.accessToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'strict',
    });

    response.cookie('refreshToken', refreshResult.refreshToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'strict',
      path: '/auth/refresh',
      ...(refreshResult.rememberMe ? { maxAge: REFRESH_TOKEN_TTL_MS } : {}),
    });
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const rawRefreshToken = request.cookies?.refreshToken as string | undefined;

    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    response.clearCookie('accessToken');
    response.clearCookie('refreshToken', { path: '/auth/refresh' });
    response.clearCookie('csrfToken');
  }

  @Get('csrf-token')
  getCsrfToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): { csrfToken: string } {
    const csrfToken = generateCsrfToken(request, response);

    return { csrfToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() request: Request): Promise<UserResponse> {
    const user = await this.authService.getProfile(request.user!.id);

    return UserResponse.fromDomain(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Body() dto: UpdateProfileDto,
    @Req() request: Request,
  ): Promise<UserResponse> {
    const user = await this.authService.updateProfile(request.user!.id, {
      name: dto.name,
      avatar: dto.avatar,
      phone: dto.phone,
      bio: dto.bio,
      language: dto.language,
      defaultCurrency: dto.defaultCurrency,
    });

    return UserResponse.fromDomain(user);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: Request,
  ): Promise<void> {
    const currentRawRefreshToken = request.cookies?.refreshToken as
      string | undefined;

    await this.authService.changePassword(request.user!.id, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      revokeOtherSessions: dto.revokeOtherSessions,
      currentRawRefreshToken,
    });
  }

  @Post('personal-access-tokens')
  @UseGuards(JwtAuthGuard)
  async createPersonalAccessToken(
    @Body() dto: CreatePersonalAccessTokenDto,
    @Req() request: Request,
  ) {
    return this.authService.createPersonalAccessToken(request.user!.id, {
      label: dto.label,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Get('personal-access-tokens')
  @UseGuards(JwtAuthGuard)
  async listPersonalAccessTokens(@Req() request: Request) {
    return this.authService.listPersonalAccessTokens(request.user!.id);
  }

  @Delete('personal-access-tokens/:id')
  @UseGuards(JwtAuthGuard)
  async revokePersonalAccessToken(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.authService.revokePersonalAccessToken(request.user!.id, id);
  }

  @Post('forgot-password')
  @Throttle({
    default: {
      limit: FORGOT_PASSWORD_THROTTLE_LIMIT,
      ttl: DEFAULT_THROTTLE_TTL_MS,
    },
    hourly: {
      limit: FORGOT_PASSWORD_HOURLY_THROTTLE_LIMIT,
      ttl: HOURLY_THROTTLE_TTL_MS,
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(dto.token);
  }
}
