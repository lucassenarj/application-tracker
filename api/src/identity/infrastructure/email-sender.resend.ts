import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailSender } from '../domain/email-sender';

@Injectable()
export class ResendEmailSender implements EmailSender {
  private resend?: Resend;

  private getClient(): Resend {
    if (!this.resend) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resend;
  }

  async send(input: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    await this.getClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: input.to,
      subject: input.subject,
      html: input.body,
    });
  }
}
