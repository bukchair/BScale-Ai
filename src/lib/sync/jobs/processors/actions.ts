import { prisma } from '@/src/lib/db/prisma';
import type { ActionPayload } from '@/src/lib/sync/queue/payloads';
import { toPrismaJson } from '@/src/lib/integrations/utils/prisma-json';

export const processAction = async (payload: ActionPayload) => {
  // Create the action record in QUEUED state. Status remains QUEUED until
  // a provider adapter actually executes the action on the platform.
  // TODO (phase-2): add per-platform write-back logic here and update
  //   status to SUCCESS / FAILED based on the platform API response.
  const action = await prisma.actionRequest.create({
    data: {
      userId: payload.userId,
      platform: payload.platform,
      connectionId: payload.connectionId,
      connectedAccountId: payload.connectedAccountId,
      actionType: payload.actionType,
      targetType: 'CAMPAIGN',
      targetExternalId: payload.targetExternalId,
      payload: toPrismaJson(payload.params),
      status: 'QUEUED',
    },
  });

  return {
    actionRequestId: action.id,
    executed: false,
    note: 'Action is queued and pending platform execution (phase-2 provider adapters).',
  };
};
