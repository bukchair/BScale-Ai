import { prisma } from '@/src/lib/db/prisma';
import { decryptSecret, encryptSecret } from '@/src/lib/crypto/token-encryption';
import type { ProviderTokenSet } from '@/src/lib/integrations/core/types';
import { TokenRefreshError } from '@/src/lib/integrations/core/errors';
import { auditService } from '@/src/lib/integrations/services/audit-service';
import { toPrismaJson } from '@/src/lib/integrations/utils/prisma-json';

export const tokenService = {
  async saveTokenSet(
    userId: string,
    connectionId: string,
    tokenSet: ProviderTokenSet
  ): Promise<void> {
    // Scope the update to the owning user so a mis-routed call can never
    // overwrite another tenant's tokens.
    const updated = await prisma.platformConnection.updateMany({
      where: { id: connectionId, userId },
      data: {
        encryptedAccessToken: encryptSecret(tokenSet.accessToken),
        encryptedRefreshToken: tokenSet.refreshToken
          ? encryptSecret(tokenSet.refreshToken)
          : undefined,
        tokenExpiresAt: tokenSet.expiresAt,
        tokenType: tokenSet.tokenType,
        scopes: tokenSet.scopes ?? [],
        externalUserId: tokenSet.externalUserId,
        externalBusinessId: tokenSet.externalBusinessId,
        metadata: tokenSet.metadata ? toPrismaJson(tokenSet.metadata) : undefined,
        status: 'CONNECTED',
        lastError: null,
      },
    });

    if (updated.count === 0) {
      throw new TokenRefreshError('Connection not found or access denied while saving token set.');
    }

    await auditService.log({
      userId,
      action: 'refresh_success',
      connectionId,
      details: { tokenExpiresAt: tokenSet.expiresAt?.toISOString() ?? null },
    });
  },

  /**
   * Decrypt and return the access token for `connectionId`.
   * @param userId  The user who owns the connection — verified against the DB
   *                to prevent cross-tenant token reads.
   */
  async getAccessToken(connectionId: string, userId: string): Promise<string> {
    const connection = await prisma.platformConnection.findFirst({
      where: { id: connectionId, userId },
      select: { encryptedAccessToken: true },
    });

    if (!connection) {
      throw new TokenRefreshError('Connection not found or access denied.');
    }
    if (!connection.encryptedAccessToken) {
      throw new TokenRefreshError('Connection access token is missing.');
    }

    return decryptSecret(connection.encryptedAccessToken);
  },

  /**
   * Decrypt and return the refresh token for `connectionId`.
   * @param userId  The user who owns the connection — verified against the DB.
   */
  async getRefreshToken(connectionId: string, userId: string): Promise<string> {
    const connection = await prisma.platformConnection.findFirst({
      where: { id: connectionId, userId },
      select: { encryptedRefreshToken: true },
    });

    if (!connection) {
      throw new TokenRefreshError('Connection not found or access denied.');
    }
    if (!connection.encryptedRefreshToken) {
      throw new TokenRefreshError('Connection refresh token is missing.');
    }

    return decryptSecret(connection.encryptedRefreshToken);
  },
};
