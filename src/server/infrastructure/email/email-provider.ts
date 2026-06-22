export interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailProvider {
  send(email: EmailRequest): Promise<void>;
}

export abstract class BaseEmailProvider implements EmailProvider {
  protected apiKey: string;
  protected defaultFromEmail: string;

  constructor(config: { apiKey: string; defaultFromEmail: string }) {
    this.apiKey = config.apiKey;
    this.defaultFromEmail = config.defaultFromEmail;
  }

  abstract send(email: EmailRequest): Promise<void>;
}