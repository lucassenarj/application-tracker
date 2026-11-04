import type { EmailVerificationToken } from '../../domain/email-verification-token';
import type { EmailVerificationTokenRepository } from '../../domain/email-verification-token.repository';

export class FakeEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  private readonly emailVerificationTokensByTokenHash = new Map<
    string,
    EmailVerificationToken
  >();

  save(emailVerificationToken: EmailVerificationToken): Promise<void> {
    this.emailVerificationTokensByTokenHash.set(
      emailVerificationToken.tokenHash,
      emailVerificationToken,
    );
    return Promise.resolve();
  }

  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return Promise.resolve(
      this.emailVerificationTokensByTokenHash.get(tokenHash) ?? null,
    );
  }
}
