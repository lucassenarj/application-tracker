import type { EmailSender } from '../../domain/email-sender';

export class FakeEmailSender implements EmailSender {
  readonly sentEmails: Array<{ to: string; subject: string; body: string }> =
    [];
  failNextSend = false;

  send(input: { to: string; subject: string; body: string }): Promise<void> {
    if (this.failNextSend) {
      this.failNextSend = false;
      return Promise.reject(new Error('Resend API error'));
    }

    this.sentEmails.push(input);
    return Promise.resolve();
  }
}
