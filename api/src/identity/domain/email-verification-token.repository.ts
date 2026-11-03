import { EmailVerificationToken } from './email-verification-token';

export interface EmailVerificationTokenRepository {
  save(emailVerificationToken: EmailVerificationToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
}
