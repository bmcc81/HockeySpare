import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private readonly apiKey = process.env.BREVO_API_KEY;
  private readonly sender = process.env.BREVO_SMS_SENDER || 'HockeySpare';
  private readonly organisationPrefix =
    process.env.BREVO_SMS_ORGANISATION_PREFIX || 'HockeySpare';

  async sendSms(args: { to: string; body: string; tag?: string }) {
    if (!this.apiKey) {
      this.logger.warn(
        `SMS skipped. BREVO_API_KEY is not configured. Recipient: ${args.to}`,
      );

      return {
        skipped: true,
        provider: 'brevo',
        reason: 'missing_api_key',
      };
    }

    const recipient = this.normalizePhone(args.to);

    if (!recipient) {
      this.logger.warn(`SMS skipped. Invalid phone number: ${args.to}`);

      return {
        skipped: true,
        provider: 'brevo',
        reason: 'invalid_phone',
      };
    }

    const payload = {
      sender: this.sender,
      recipient,
      content: args.body,
      type: 'transactional',
      tag: args.tag ?? 'spare-request',
      unicodeEnabled: true,
      organisationPrefix: this.organisationPrefix,
    };

    this.logger.log(
      `Sending Brevo SMS to ${recipient} with sender ${this.sender}`,
    );

    const response = await fetch(
      'https://api.brevo.com/v3/transactionalSMS/send',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const responseText = await response.text();

    let responseBody: unknown = null;

    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseBody = responseText;
    }

    if (!response.ok) {
      this.logger.error(
        `Brevo SMS failed. Status=${response.status}. Body=${JSON.stringify(
          responseBody,
        )}`,
      );

      throw new Error(`Brevo SMS failed with status ${response.status}`);
    }

    this.logger.log(`Brevo SMS sent. Response=${JSON.stringify(responseBody)}`);

    return {
      provider: 'brevo',
      response: responseBody,
    };
  }

  private normalizePhone(phone: string): string | null {
    const trimmed = phone.trim();

    if (!trimmed) {
      return null;
    }

    const digitsOnly = trimmed.replace(/[^\d+]/g, '');

    if (digitsOnly.startsWith('+')) {
      return digitsOnly;
    }

    // Default to North America/Canada if the user entered 10 digits.
    const justDigits = digitsOnly.replace(/\D/g, '');

    if (justDigits.length === 10) {
      return `+1${justDigits}`;
    }

    if (justDigits.length >= 11 && justDigits.length <= 15) {
      return `+${justDigits}`;
    }

    return null;
  }
}
