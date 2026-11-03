import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { generateCsrfToken } from '../csrf.config';
import { AuthService, REFRESH_TOKEN_TTL_MS } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponse } from './dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const isDev = process.env.NODE_ENV !== 'production';

@Controller('auth')
@SerializeOptions({ excludeExtraneousValues: true })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserResponse> {
    const user = await this.authService.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });

    return UserResponse.fromDomain(user);
  }

  @Post('login')
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

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
