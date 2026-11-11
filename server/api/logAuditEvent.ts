import { z } from 'zod';
import { createEndpoint } from '../lib/endpoint';
import { AuditLog } from '../airtable/index';

export default createEndpoint({
  description: 'Logs an audit event for the signed-in user. Who did it comes from the session, never from the request.',
  authenticated: true,
  inputSchema: z.object({
    action: z.string().max(100),
    leadId: z.string().optional(),
    details: z.string().max(2000).optional(),
    /** Still sent by the UI; ignored — the audit row is attributed to the caller. */
    userName: z.string().optional(),
    userEmail: z.string().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ input, context }) => {
    const processedDetails = input.details
      ? `${input.details}${input.leadId ? ` (Lead ID: ${input.leadId})` : ''}`
      : input.leadId
      ? `Lead ID: ${input.leadId}`
      : undefined;

    const createAuditLog = await AuditLog.create({
      record: {
        actions: input.action,
        assignedPro: [context.user.id],
        details: processedDetails,
      },
    });

    return { success: true, auditId: createAuditLog.id };
  },
});
