import { PersonalAccessToken } from './personal-access-token';

export interface PersonalAccessTokenRepository {
  save(personalAccessToken: PersonalAccessToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PersonalAccessToken | null>;
  findAllByUserId(userId: string): Promise<PersonalAccessToken[]>;
  findById(id: string): Promise<PersonalAccessToken | null>;
}
