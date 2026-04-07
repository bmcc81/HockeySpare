import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get<string>('MAIL_PORT')),
      secure: this.config.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendTestEmail(to: string) {
    console.log('sendTestEmail ->', { to });

    const info = await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject: 'Test email',
      text: 'This is a test from HockeySpare.',
    });

    console.log('sendTestEmail success ->', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  }

  async verifyConnection() {
    const ok = await this.transporter.verify();
    console.log('SMTP verify ->', ok);
  }

  async sendBookingCreatedToRequestOwner(input: {
    to: string;
    ownerName?: string;
    requestId: number;
    teamName?: string | null;
    arena?: string | null;
    date?: string | null;
    time?: string | null;
    bookedByName?: string | null;
  }) {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:4200';
    const reviewUrl = `${appUrl}/requests/${input.requestId}`;

    console.log('sendBookingCreatedToRequestOwner called ->', {
      to: input.to,
      requestId: input.requestId,
    });

    console.log('mail config ->', {
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<string>('MAIL_PORT'),
      secure: this.config.get<string>('MAIL_SECURE'),
      from: this.config.get<string>('MAIL_FROM'),
      user: this.config.get<string>('MAIL_USER'),
    });

    const info = await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: input.to,
      subject: `New booking for Request #${input.requestId}`,
      html: `
        <p>Hi ${input.ownerName || ''},</p>
        <p>A user has booked your request.</p>
        <p><strong>Request #${input.requestId}</strong></p>
        <p><a href="${reviewUrl}">Review request</a></p>
        `,
      text: [
        `Hi ${input.ownerName || ''},`,
        '',
        `A user has booked your request.`,
        `Request #${input.requestId}`,
        input.teamName ? `Team: ${input.teamName}` : null,
        input.arena ? `Arena: ${input.arena}` : null,
        input.date ? `Date: ${input.date}` : null,
        input.time ? `Time: ${input.time}` : null,
        input.bookedByName ? `Booked by: ${input.bookedByName}` : null,
        '',
        `Review it here: ${reviewUrl}`,
        `If you confirm the booking, mark the request as filled.`,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    console.log('sendBookingCreatedToRequestOwner success ->', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  }
}
