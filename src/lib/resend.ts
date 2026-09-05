import 'server-only';

import { Resend } from 'resend';

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_ADDRESS?.trim();

  if (!apiKey || !from) {
    console.error('[sendEmail] Missing RESEND_API_KEY or RESEND_FROM_ADDRESS — email not sent');
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [options.to],
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    console.error('[sendEmail] Resend error:', error);
  }
}
