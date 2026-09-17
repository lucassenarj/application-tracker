import { RefreshToken } from './refresh-token';

export interface RefreshTokenRepository {
  save(refreshToken: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  findAllByFamilyId(familyId: string): Promise<RefreshToken[]>;
}
