import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { PersonalAccessTokenRepository } from '../domain/personal-access-token.repository';
import { hashToken } from '../infrastructure/token-crypto';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(
    @Inject('PersonalAccessTokenRepository')
    private readonly personalAccessTokenRepository: PersonalAccessTokenRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing personal access token');
    }

    const rawToken = authorizationHeader.slice('Bearer '.length);
    const personalAccessToken =
      await this.personalAccessTokenRepository.findByTokenHash(
        hashToken(rawToken),
      );

    if (!personalAccessToken || !personalAccessToken.isValid()) {
      throw new UnauthorizedException('invalid personal access token');
    }

    request.user = { id: personalAccessToken.userId };

    void this.personalAccessTokenRepository.save(
      personalAccessToken.markUsed(),
    );

    return true;
  }
}
