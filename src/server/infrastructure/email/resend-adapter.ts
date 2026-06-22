import { BaseEmailProvider, EmailRequest } from './email-provider';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'ResendAdapter' });

export class ResendAdapter extends BaseEmailProvider {
  constructor() {
    super({
      apiKey: env.RESEND_API_KEY || '',
      defaultFromEmail: 'ExamSphere <noreply@examsphere.com>',
    });
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async send(email: EmailRequest): Promise<void> {
    if (!this.isAvailable()) {
      log.warn('Resend API key not configured. Skipping email send.');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: email.from || this.defaultFromEmail,
          to: email.to,
          subject: email.subject,
          html: email.html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Resend API error ${response.status}: ${errorBody}`);
      }

      log.info({ to: email.to, subject: email.subject }, 'Email sent successfully');
    } catch (error) {
      log.error({ error, email }, 'Failed to send email via Resend');
      throw error;
    }
  }
}

export const emailProvider = new ResendAdapter();