import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/src/lib/db/prisma';
import { integrationsEnv } from '@/src/lib/env/integrations-env';
import { connectionService } from '@/src/lib/integrations/services/connection-service';
import { GmailProvider } from '@/src/lib/integrations/providers/gmail/provider';

const TOKEN_BYTES = 32;
const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

export const normalizeSignupEmail = (value: string) => value.trim().toLowerCase();

export function generateSignupToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashSignupToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getSignupAdminEmail(): string {
  const fromEnv =
    process.env.ADMIN_MAIL_SENDER_EMAIL?.trim() || process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim();
  if (!fromEnv) {
    throw new Error('Set ADMIN_MAIL_SENDER_EMAIL or NEXT_PUBLIC_ADMIN_EMAIL for email signup.');
  }
  return normalizeSignupEmail(fromEnv);
}

export async function resolveAdminGmailSender(): Promise<{
  userId: string;
  connectionId: string;
  sendFromEmail: string;
}> {
  const adminEmail = getSignupAdminEmail();
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });
  if (!adminUser) {
    throw new Error(
      `No database user for admin email ${adminEmail}. The admin account must sign in once so the user record exists.`
    );
  }
  const connection = await connectionService.getByUserPlatform(adminUser.id, 'GMAIL');
  if (!connection || connection.status !== 'CONNECTED') {
    throw new Error(
      'Admin Gmail is not connected. Connect Gmail under Integrations (same account as ADMIN_MAIL_SENDER_EMAIL) with send permission.'
    );
  }
  const account =
    connection.connectedAccounts.find((a) => a.isSelected) || connection.connectedAccounts[0];
  const sendFromEmail = account?.externalAccountId || adminEmail;
  return { userId: adminUser.id, connectionId: connection.id, sendFromEmail };
}

export async function sendSignupInviteEmail(params: {
  toEmail: string;
  name?: string | null;
  confirmUrl: string;
  isHebrew?: boolean;
}): Promise<void> {
  const { userId, connectionId } = await resolveAdminGmailSender();
  const gmail = new GmailProvider();
  const subject = params.isHebrew
    ? 'אישור הרשמה ל-BScale AI'
    : 'Confirm your BScale AI registration';
  const greeting = params.name?.trim()
    ? params.isHebrew
      ? `שלום ${params.name.trim()},`
      : `Hi ${params.name.trim()},`
    : params.isHebrew
      ? 'שלום,'
      : 'Hello,';
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <p>${greeting}</p>
  <p>${params.isHebrew ? 'לחץ על הקישור להשלמת פתיחת החשבון והגדרת סיסמה:' : 'Click the link below to finish setting up your account and password:'}</p>
  <p><a href="${params.confirmUrl}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${params.isHebrew ? 'אשר והמשך' : 'Confirm and continue'}</a></p>
  <p style="font-size:13px;color:#666">${params.isHebrew ? 'אם לא ביקשת להירשם, התעלם מהודעה זו.' : "If you didn't request this, you can ignore this email."}</p>
  <p style="font-size:12px;color:#999;word-break:break-all">${params.confirmUrl}</p>
</body>
</html>`.trim();
  await gmail.sendHtmlEmail(connectionId, userId, {
    to: params.toEmail,
    subject,
    html,
    textFallback: `${greeting}\n\n${params.confirmUrl}\n`,
  });
}

export function buildConfirmUrl(token: string): string {
  const base = integrationsEnv.APP_BASE_URL.replace(/\/$/, '');
  return `${base}/auth/complete-email?token=${encodeURIComponent(token)}`;
}

export { INVITE_TTL_MS };
