import type { EmailSender } from '../../domain/email-sender';

export class FakeEmailSender implements EmailSender {
  readonly sentEmails: Array<{ to: string; subject: string; body: string }> =
    [];

  send(input: { to: string; subject: string; body: string }): Promise<void> {
    this.sentEmails.push(input);
    return Promise.resolve();
  }
}
