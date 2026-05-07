import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get<string>('MAIL_PORT') ?? 587),
      secure: this.config.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendTestEmail(to: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to,
      subject: 'Test email',
      text: 'This is a test from HockeySpare.',
    });
  }

  async sendBookingCreatedToBookingUser(args: {
    to: string;
    bookedByName: string;
    requestId: number;
    teamName: string | null;
    arena: string | null;
    date?: string | null;
    time: string | null;
  }): Promise<void> {
    const appUrl = this.getAppUrl();
    const myBookingsUrl = `${appUrl}/bookings/my-bookings`;

    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to: args.to,
      subject: 'Your hockey booking request was sent',
      text: [
        `Hi ${args.bookedByName},`,
        '',
        'Your booking request was sent successfully.',
        '',
        `Request #${args.requestId}`,
        args.teamName ? `Team: ${args.teamName}` : null,
        args.arena ? `Arena: ${args.arena}` : null,
        args.date ? `Date: ${args.date}` : null,
        args.time ? `Time: ${args.time}` : null,
        '',
        'The team will review your request.',
        '',
        `View your bookings here: ${myBookingsUrl}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <p>Hi <strong>${args.bookedByName}</strong>,</p>

        <p>Your booking request was sent successfully.</p>

        <p>
          <strong>Request #${args.requestId}</strong><br />
          ${args.teamName ? `Team: ${args.teamName}<br />` : ''}
          ${args.arena ? `Arena: ${args.arena}<br />` : ''}
          ${args.date ? `Date: ${args.date}<br />` : ''}
          ${args.time ? `Time: ${args.time}<br />` : ''}
        </p>

        <p>The team will review your request.</p>

        <p>
          <a href="${myBookingsUrl}">View my bookings</a>
        </p>

        <p>Thanks,<br />HockeySpare Team</p>
      `,
    });
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
  }): Promise<void> {
    const appUrl = this.getAppUrl();
    const reviewUrl = `${appUrl}/bookings/incoming`;

    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to: input.to,
      subject: `New booking for Request #${input.requestId}`,
      html: `
        <p>Hi ${input.ownerName || ''},</p>

        <p>
          <strong>${input.bookedByName || 'A player'}</strong> has booked your request.
        </p>

        <p>
          <strong>Request #${input.requestId}</strong><br />
          ${input.teamName ? `Team: ${input.teamName}<br />` : ''}
          ${input.arena ? `Arena: ${input.arena}<br />` : ''}
          ${input.date ? `Date: ${input.date}<br />` : ''}
          ${input.time ? `Time: ${input.time}<br />` : ''}
        </p>

        <p>
          <a href="${reviewUrl}">Review incoming booking</a>
        </p>

        <p>If you confirm the booking, mark the request as filled.</p>

        <p>Thanks,<br />HockeySpare Team</p>
      `,
      text: [
        `Hi ${input.ownerName || ''},`,
        '',
        `${input.bookedByName || 'A player'} has booked your request.`,
        '',
        `Request #${input.requestId}`,
        input.teamName ? `Team: ${input.teamName}` : null,
        input.arena ? `Arena: ${input.arena}` : null,
        input.date ? `Date: ${input.date}` : null,
        input.time ? `Time: ${input.time}` : null,
        '',
        `Review it here: ${reviewUrl}`,
        '',
        'If you confirm the booking, mark the request as filled.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  private getAppUrl(): string {
    const nodeEnv = this.config.get<string>('NODE_ENV');

    const defaultAppUrl =
      nodeEnv === 'production'
        ? 'https://hockeyspare.webinkgraphics.com'
        : 'http://localhost:4200';

    const appUrl = this.config.get<string>('APP_URL') ?? defaultAppUrl;

    return appUrl.replace(/\/$/, '');
  }

  private getMailFrom(): string {
    return (
      this.config.get<string>('MAIL_FROM') ??
      'HockeySpare <no-reply@hockeyspare.com>'
    );
  }

  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();

      console.log('Email SMTP connection verified:', {
        host: this.config.get<string>('MAIL_HOST'),
        port: this.config.get<string>('MAIL_PORT'),
        secure: this.config.get<string>('MAIL_SECURE'),
        from: this.config.get<string>('MAIL_FROM'),
      });
    } catch (error) {
      const err = error as {
        message?: string;
        code?: string;
        response?: string;
        responseCode?: number;
      };

      console.error('Email SMTP connection failed:', {
        message: err.message,
        code: err.code,
        response: err.response,
        responseCode: err.responseCode,
      });
    }
  }

  async sendBookingDeclinedToBookingUser(args: {
    to: string;
    bookedByName: string;
    requestId: number;
    teamName: string | null;
    arena: string | null;
    date?: string | null;
    time: string | null;
    message?: string | null;
  }): Promise<void> {
    const appUrl = this.getAppUrl();
    const myBookingsUrl = `${appUrl}/bookings/my-bookings`;

    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to: args.to,
      subject: 'Your hockey booking request was declined',
      text: [
        `Hi ${args.bookedByName},`,
        '',
        'Your booking request was declined.',
        '',
        `Request #${args.requestId}`,
        args.teamName ? `Team: ${args.teamName}` : null,
        args.arena ? `Arena: ${args.arena}` : null,
        args.date ? `Date: ${args.date}` : null,
        args.time ? `Time: ${args.time}` : null,
        '',
        `View your bookings here: ${myBookingsUrl}`,
        '',
        'Thanks,',
        'HockeySpare Team',
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
      <p>Hi <strong>${args.bookedByName}</strong>,</p>

      <p>Your booking request was declined.</p>

      <p>
        <strong>Request #${args.requestId}</strong><br />
        ${args.teamName ? `Team: ${args.teamName}<br />` : ''}
        ${args.arena ? `Arena: ${args.arena}<br />` : ''}
        ${args.date ? `Date: ${args.date}<br />` : ''}
        ${args.time ? `Time: ${args.time}<br />` : ''}
      </p>

      <p>
        <a href="${myBookingsUrl}">View my bookings</a>
      </p>

      <p>Thanks,<br />HockeySpare Team</p>
    `,
    });
  }
}
