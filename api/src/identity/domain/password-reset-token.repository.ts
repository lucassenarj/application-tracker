import { PasswordResetToken } from './password-reset-token';

export interface PasswordResetTokenRepository {
  save(passwordResetToken: PasswordResetToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
}
