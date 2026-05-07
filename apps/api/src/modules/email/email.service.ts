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

  async sendMail(args: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
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

  async verifyConnection(): Promise<void> {
    await this.transporter.verify();
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
    const reviewUrl = `${this.getAppUrl()}/bookings/incoming`;

    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to: input.to,
      subject: `New booking for Request #${input.requestId}`,
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
        '',
        'Thanks,',
        'HockeySpare Team',
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <p>Hi ${this.escapeHtml(input.ownerName || '')},</p>

        <p>
          <strong>${this.escapeHtml(input.bookedByName || 'A player')}</strong>
          has booked your request.
        </p>

        <p>
          <strong>Request #${input.requestId}</strong><br />
          ${input.teamName ? `Team: ${this.escapeHtml(input.teamName)}<br />` : ''}
          ${input.arena ? `Arena: ${this.escapeHtml(input.arena)}<br />` : ''}
          ${input.date ? `Date: ${this.escapeHtml(input.date)}<br />` : ''}
          ${input.time ? `Time: ${this.escapeHtml(input.time)}<br />` : ''}
        </p>

        <p>
          <a href="${reviewUrl}">Review incoming booking</a>
        </p>

        <p>If you confirm the booking, mark the request as filled.</p>

        <p>Thanks,<br />HockeySpare Team</p>
      `,
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
    const myBookingsUrl = `${this.getAppUrl()}/bookings/my-bookings`;

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
        '',
        'Thanks,',
        'HockeySpare Team',
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <p>Hi <strong>${this.escapeHtml(args.bookedByName)}</strong>,</p>

        <p>Your booking request was sent successfully.</p>

        <p>
          <strong>Request #${args.requestId}</strong><br />
          ${args.teamName ? `Team: ${this.escapeHtml(args.teamName)}<br />` : ''}
          ${args.arena ? `Arena: ${this.escapeHtml(args.arena)}<br />` : ''}
          ${args.date ? `Date: ${this.escapeHtml(args.date)}<br />` : ''}
          ${args.time ? `Time: ${this.escapeHtml(args.time)}<br />` : ''}
        </p>

        <p>The team will review your request.</p>

        <p>
          <a href="${myBookingsUrl}">View my bookings</a>
        </p>

        <p>Thanks,<br />HockeySpare Team</p>
      `,
    });
  }

  async sendBookingConfirmedToBookingUser(args: {
    to: string;
    bookedByName: string;
    requestId: number;
    teamName: string | null;
    arena: string | null;
    date?: string | null;
    time: string | null;
    message?: string | null;
  }): Promise<void> {
    const myBookingsUrl = `${this.getAppUrl()}/bookings/my-bookings`;

    await this.transporter.sendMail({
      from: this.getMailFrom(),
      to: args.to,
      subject: 'Your hockey booking request was confirmed',
      text: [
        `Hi ${args.bookedByName},`,
        '',
        'Your booking request was confirmed.',
        '',
        `Request #${args.requestId}`,
        args.teamName ? `Team: ${args.teamName}` : null,
        args.arena ? `Arena: ${args.arena}` : null,
        args.date ? `Date: ${args.date}` : null,
        args.time ? `Time: ${args.time}` : null,
        args.message ? '' : null,
        args.message ? `Message from the team: ${args.message}` : null,
        '',
        `View your bookings here: ${myBookingsUrl}`,
        '',
        'Thanks,',
        'HockeySpare Team',
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <p>Hi <strong>${this.escapeHtml(args.bookedByName)}</strong>,</p>

        <p>Your booking request was confirmed.</p>

        <p>
          <strong>Request #${args.requestId}</strong><br />
          ${args.teamName ? `Team: ${this.escapeHtml(args.teamName)}<br />` : ''}
          ${args.arena ? `Arena: ${this.escapeHtml(args.arena)}<br />` : ''}
          ${args.date ? `Date: ${this.escapeHtml(args.date)}<br />` : ''}
          ${args.time ? `Time: ${this.escapeHtml(args.time)}<br />` : ''}
        </p>

        ${
          args.message
            ? `<p><strong>Message from the team:</strong><br />${this.escapeHtml(
                args.message,
              )}</p>`
            : ''
        }

        <p>
          <a href="${myBookingsUrl}">View my bookings</a>
        </p>

        <p>Thanks,<br />HockeySpare Team</p>
      `,
    });
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
    const myBookingsUrl = `${this.getAppUrl()}/bookings/my-bookings`;

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
        args.message ? '' : null,
        args.message ? `Message from the team: ${args.message}` : null,
        '',
        `View your bookings here: ${myBookingsUrl}`,
        '',
        'Thanks,',
        'HockeySpare Team',
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <p>Hi <strong>${this.escapeHtml(args.bookedByName)}</strong>,</p>

        <p>Your booking request was declined.</p>

        <p>
          <strong>Request #${args.requestId}</strong><br />
          ${args.teamName ? `Team: ${this.escapeHtml(args.teamName)}<br />` : ''}
          ${args.arena ? `Arena: ${this.escapeHtml(args.arena)}<br />` : ''}
          ${args.date ? `Date: ${this.escapeHtml(args.date)}<br />` : ''}
          ${args.time ? `Time: ${this.escapeHtml(args.time)}<br />` : ''}
        </p>

        ${
          args.message
            ? `<p><strong>Message from the team:</strong><br />${this.escapeHtml(
                args.message,
              )}</p>`
            : ''
        }

        <p>
          <a href="${myBookingsUrl}">View my bookings</a>
        </p>

        <p>Thanks,<br />HockeySpare Team</p>
      `,
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
}