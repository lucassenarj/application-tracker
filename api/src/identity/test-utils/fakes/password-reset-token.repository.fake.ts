import type { PasswordResetToken } from '../../domain/password-reset-token';
import type { PasswordResetTokenRepository } from '../../domain/password-reset-token.repository';

export class FakePasswordResetTokenRepository implements PasswordResetTokenRepository {
  private readonly passwordResetTokensByTokenHash = new Map<
    string,
    PasswordResetToken
  >();

  save(passwordResetToken: PasswordResetToken): Promise<void> {
    this.passwordResetTokensByTokenHash.set(
      passwordResetToken.tokenHash,
      passwordResetToken,
    );
    return Promise.resolve();
  }

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return Promise.resolve(
      this.passwordResetTokensByTokenHash.get(tokenHash) ?? null,
    );
  }
}
