import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies?.accessToken as string | undefined;

    if (!accessToken) {
      throw new UnauthorizedException('missing access token');
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(accessToken);
      request.user = { id: payload.sub };
    } catch {
      throw new UnauthorizedException('invalid access token');
    }

    return true;
  }
}
