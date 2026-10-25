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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
    });

    return UserResponse.fromDomain(user);
  }
}
