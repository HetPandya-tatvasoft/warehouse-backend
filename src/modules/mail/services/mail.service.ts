import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import type { ISendMailOptions } from '../interfaces/mail.interface';
import { MESSAGES } from '@/common/constants/messages.constants';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = parseInt(this.configService.getOrThrow<string>('SMTP_PORT'), 10);
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');

    const transportOptions: SMTPTransport.Options = {
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      requireTLS: port !== 465,
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.transporter = createTransport(transportOptions);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();

      this.logger.log(MESSAGES.COMMON.SMTP_SUCCESS);
    } catch (error) {
      this.logger.error(MESSAGES.COMMON.SMTP_VERIFICATION_FAILED, error instanceof Error ? error.stack : String(error));

      throw error;
    }
  }

  async send(options: ISendMailOptions): Promise<void> {
    try {
      const from = this.configService.getOrThrow<string>('SMTP_FROM');

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      this.logger.log(`Email sent successfully to ${recipients}`);
    } catch (error) {
      this.logger.error(MESSAGES.COMMON.EMAIL_SEND_FAILED, error instanceof Error ? error.stack : String(error));

      throw new InternalServerErrorException(MESSAGES.COMMON.EMAIL_SEND_ERROR);
    }
  }
}
