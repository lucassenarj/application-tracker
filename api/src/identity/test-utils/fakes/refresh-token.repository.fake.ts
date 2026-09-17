import type { RefreshToken } from '../../domain/refresh-token';
import type { RefreshTokenRepository } from '../../domain/refresh-token.repository';

export class FakeRefreshTokenRepository implements RefreshTokenRepository {
  private readonly refreshTokensByTokenHash = new Map<string, RefreshToken>();

  save(refreshToken: RefreshToken): Promise<void> {
    this.refreshTokensByTokenHash.set(refreshToken.tokenHash, refreshToken);
    return Promise.resolve();
  }

  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return Promise.resolve(
      this.refreshTokensByTokenHash.get(tokenHash) ?? null,
    );
  }

  findAllByFamilyId(familyId: string): Promise<RefreshToken[]> {
    return Promise.resolve(
      [...this.refreshTokensByTokenHash.values()].filter(
        (refreshToken) => refreshToken.familyId === familyId,
      ),
    );
  }
}
