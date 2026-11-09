import type { PersonalAccessToken } from '../../domain/personal-access-token';
import type { PersonalAccessTokenRepository } from '../../domain/personal-access-token.repository';

export class FakePersonalAccessTokenRepository implements PersonalAccessTokenRepository {
  private readonly personalAccessTokensByTokenHash = new Map<
    string,
    PersonalAccessToken
  >();

  save(personalAccessToken: PersonalAccessToken): Promise<void> {
    this.personalAccessTokensByTokenHash.set(
      personalAccessToken.tokenHash,
      personalAccessToken,
    );
    return Promise.resolve();
  }

  findByTokenHash(tokenHash: string): Promise<PersonalAccessToken | null> {
    return Promise.resolve(
      this.personalAccessTokensByTokenHash.get(tokenHash) ?? null,
    );
  }

  findAllByUserId(userId: string): Promise<PersonalAccessToken[]> {
    return Promise.resolve(
      [...this.personalAccessTokensByTokenHash.values()].filter(
        (personalAccessToken) => personalAccessToken.userId === userId,
      ),
    );
  }

  findById(id: string): Promise<PersonalAccessToken | null> {
    return Promise.resolve(
      [...this.personalAccessTokensByTokenHash.values()].find(
        (personalAccessToken) => personalAccessToken.id === id,
      ) ?? null,
    );
  }
}
