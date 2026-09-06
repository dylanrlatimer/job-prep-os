import { NextRequest, NextResponse } from 'next/server';
import { getLocale } from 'next-intl/server';
import { handleApiError } from '@/lib/api-errors';
import { sendEmail } from '@/lib/resend';
import { getAppUrl } from '@/lib/seo';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ForgotPasswordSchema } from '@/features/auth/api/contracts';
import { buildResetPasswordEmail } from '@/features/auth/emails/build-reset-password-email';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email } = ForgotPasswordSchema.parse(body);

    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      if (linkError || !linkData.properties?.hashed_token) {
        console.error('[POST /api/auth/forgot-password] generateLink error:', linkError);
        return NextResponse.json(null);
      }

      let appUrl: string;
      try {
        appUrl = getAppUrl();
      } catch (urlError) {
        console.error('[POST /api/auth/forgot-password] Missing NEXT_PUBLIC_APP_URL', urlError);
        return NextResponse.json(null);
      }

      const confirmParams = new URLSearchParams({
        token_hash: linkData.properties.hashed_token,
        type: 'recovery',
        next: '/auth/update-password',
      });
      const resetLink = new URL(`/auth/confirm?${confirmParams.toString()}`, appUrl).toString();

      const locale = await getLocale();
      const { subject, html } = await buildResetPasswordEmail(resetLink, locale);
      await sendEmail({ to: email, subject, html });
    } catch (innerError) {
      console.error('[POST /api/auth/forgot-password] error:', innerError);
    }

    return NextResponse.json(null);
  } catch (error) {
    return handleApiError(req, error);
  }
}
