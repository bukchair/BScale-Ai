import { prisma } from '@/src/lib/db/prisma';
import { integrationsEnv } from '@/src/lib/env/integrations-env';
import { BaseGoogleProvider } from '@/src/lib/integrations/providers/google-shared/provider-base';
import type { DiscoveredAccount, ProviderCapability, TestResult } from '@/src/lib/integrations/core/types';
import {
  ExternalApiError,
  IntegrationError,
  NoAccountsFoundError,
  PlatformPermissionError,
  ProviderConfigError,
} from '@/src/lib/integrations/core/errors';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

type GmailProfileResponse = {
  emailAddress?: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
};

type GmailListResponse = {
  messages?: Array<{ id?: string; threadId?: string }>;
  resultSizeEstimate?: number;
};

export class GmailProvider extends BaseGoogleProvider {
  readonly platform = 'GMAIL' as const;
  readonly oauthScopes = integrationsEnv.ENABLE_GMAIL_SEND_SCOPE
    ? (['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'] as const)
    : (['https://www.googleapis.com/auth/gmail.readonly'] as const);

  readonly capabilities: readonly ProviderCapability[] = integrationsEnv.ENABLE_GMAIL_SEND_SCOPE
    ? (['ACCOUNT_DISCOVERY', 'REPORTING_TEST', 'TOKEN_REFRESH', 'SEND_EMAIL'] as const)
    : (['ACCOUNT_DISCOVERY', 'REPORTING_TEST', 'TOKEN_REFRESH'] as const);

  private async requestGmail<T>(connectionId: string, userId: string, path: string, init?: RequestInit): Promise<T> {
    const accessToken = await this.getValidAccessToken(connectionId, userId);
    const response = await fetch(`${GMAIL_API_BASE}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const raw = await response.text();
    let parsed: unknown = {};
    if (raw.trim()) {
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        parsed = { raw: raw.slice(0, 200) };
      }
    }

    if (!response.ok) {
      if (response.status === 403) {
        throw new PlatformPermissionError('Gmail permission is insufficient.');
      }
      throw new ExternalApiError('Gmail API request failed.', { status: response.status, response: parsed });
    }
    return parsed as T;
  }

  async discoverAccounts(connectionId: string, userId: string): Promise<DiscoveredAccount[]> {
    const profile = await this.requestGmail<GmailProfileResponse>(connectionId, userId, '/users/me/profile');
    if (!profile.emailAddress) {
      throw new NoAccountsFoundError('No Gmail mailbox is available for this user.');
    }

    return [
      {
        externalAccountId: profile.emailAddress,
        name: profile.emailAddress,
        status: 'active',
        metadata: {
          messagesTotal: profile.messagesTotal ?? 0,
          threadsTotal: profile.threadsTotal ?? 0,
          historyId: profile.historyId ?? null,
        },
      },
    ];
  }

  encodeMimeSubject(subject: string): string {
    if (/^[\x00-\x7F]*$/.test(subject)) return subject;
    const b64 = Buffer.from(subject, 'utf8').toString('base64');
    return `=?UTF-8?B?${b64}?=`;
  }

  /**
   * Send HTML email from the connected Gmail mailbox (requires ENABLE_GMAIL_SEND_SCOPE=true).
   */
  async sendHtmlEmail(
    connectionId: string,
    userId: string,
    params: { to: string; subject: string; html: string; textFallback?: string }
  ): Promise<void> {
    if (!integrationsEnv.ENABLE_GMAIL_SEND_SCOPE) {
      throw new ProviderConfigError(
        'Gmail send is disabled. Set ENABLE_GMAIL_SEND_SCOPE=true and reconnect Gmail with send permission.'
      );
    }
    const to = params.to.trim();
    if (!to || !to.includes('@')) {
      throw new IntegrationError('BAD_REQUEST', 'Invalid recipient email.', 400);
    }
    const stripHtml = (html: string) =>
      html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);
    const boundary = `bscale_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const textPart = params.textFallback?.trim() || stripHtml(params.html) || '(no plain text)';
    const message = [
      `To: ${to}`,
      `Subject: ${this.encodeMimeSubject(params.subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      textPart,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      params.html,
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const raw = Buffer.from(message, 'utf8').toString('base64url');
    await this.requestGmail<Record<string, unknown>>(connectionId, userId, '/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw }),
    });
  }

  async testConnection(connectionId: string, userId: string): Promise<TestResult> {
    const connection = await prisma.platformConnection.findUnique({
      where: { id: connectionId },
      include: { connectedAccounts: true },
    });
    if (!connection) {
      throw new ExternalApiError('Gmail connection not found.');
    }

    const profile = await this.requestGmail<GmailProfileResponse>(connectionId, userId, '/users/me/profile');
    const recent = await this.requestGmail<GmailListResponse>(
      connectionId,
      userId,
      '/users/me/messages?maxResults=10&includeSpamTrash=false'
    );

    return {
      ok: true,
      message: 'Gmail connection is valid.',
      summary: {
        emailAddress: profile.emailAddress ?? null,
        messagesTotal: profile.messagesTotal ?? 0,
        threadsTotal: profile.threadsTotal ?? 0,
        recentMessageRefs: (recent.messages ?? []).map((item) => ({
          id: item.id ?? '',
          threadId: item.threadId ?? '',
        })),
      },
    };
  }
}
