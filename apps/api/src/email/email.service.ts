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
    const reviewUrl = `${appUrl}/bookings/incoming`;

    console.log('sendBookingCreatedToRequestOwner called ->', {
      to: input.to,
      requestId: input.requestId,
    });

    const info = await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: input.to,
      subject: `New booking for Request #${input.requestId}`,
      html: `
        <p>Hi ${input.ownerName || ''},</p>
        <p>The user: ${input.bookedByName} has booked your request. For the game at ${input.time || 'TBD'} on ${input.date || 'TBD'} at ${input.arena || 'TBD'}.</p>
        <p><strong>Request #${input.requestId}</strong></p>
        <p><a href="${reviewUrl}">Review request</a></p>
        <p>If you confirm the booking, mark the request as filled.</p>
        <p>Thanks,<br/>HockeySpare Team</p>
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

    console.log('input', input);

    console.log('sendBookingCreatedToRequestOwner success ->', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  }
}
