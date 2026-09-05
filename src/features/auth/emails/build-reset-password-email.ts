import 'server-only';

import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function buildResetPasswordEmail(resetLink: string, locale: string): Promise<{ subject: string; html: string }> {
  const safeLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: safeLocale, namespace: 'AuthEmails.resetPassword' });
  const link = escapeHtml(resetLink);

  const html = `<!DOCTYPE html>
<html lang="${safeLocale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(t('subject'))}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 48px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
            <tr>
              <td align="center" style="padding-bottom: 32px;">
                <span style="font-size: 22px; font-weight: 700; color: #09090b; letter-spacing: -0.02em;">JobPrepOS</span>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e4e4e7; padding: 40px 40px 36px;">
                <p style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #09090b;">${escapeHtml(t('heading'))}</p>
                <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #71717a;">${escapeHtml(t('body'))}</p>
                <table cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td style="background-color: #09090b; border-radius: 6px;">
                      <a href="${link}" style="display: inline-block; padding: 12px 24px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                        ${escapeHtml(t('button'))}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                  ${escapeHtml(t('ignore'))}<br /><br />
                  ${escapeHtml(t('expiry'))}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top: 24px;">
                <p style="margin: 0; font-size: 12px; color: #a1a1aa;">© JobPrepOS</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: t('subject'), html };
}
