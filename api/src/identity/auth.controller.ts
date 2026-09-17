import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponse } from './dto/user-response.dto';

const isDev = process.env.NODE_ENV !== 'production';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserResponse> {
    const user = await this.authService.register({
      email: dto.email,
      password: dto.password,
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
  }
}
