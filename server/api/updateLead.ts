import { z } from 'zod';
import { ApiError, createEndpoint } from '../lib/endpoint';
import { NisLeads } from '../airtable/index';
import { isManager, ownsLead } from '../lib/access';

export default createEndpoint({
  description: 'Updates a lead record in the NIS Leads table with the provided field values',
  authenticated: true,
  inputSchema: z.object({
    id: z.string(),
    status: z.string().optional(),
    assignedPro: z.array(z.string()).optional(),
    closeReason: z.string().optional(),
    leadDetails: z.string().optional(),
    dateAssigned: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().optional(),
    customerPhone: z.string().optional(),
    opportunityName: z.string().optional(),
    assignmentNeeded: z.boolean().optional(),
  }),
  outputSchema: z.any(),
  execute: async ({ input, context }) => {
    const manager = isManager(context.user);

    // A Pro may only edit a lead assigned to them, and only its status, close
    // reason and notes — the same fields the lead form leaves enabled for them.
    // The form still submits the manager-only fields (unchanged), so those are
    // dropped rather than rejected; an actual change of owner is refused.
    if (!manager) {
      const lead = await NisLeads.findOne({ id: input.id });
      if (!lead || !ownsLead(context.user, lead)) {
        throw new ApiError({ code: 'FORBIDDEN', message: 'That lead is not assigned to you.' });
      }
      if (input.assignedPro !== undefined) {
        // The form echoes the owner back (only the first, on a co-assigned
        // lead), and a Pro's write never stores it. Refuse only a rep who is
        // not already on the lead.
        const current = ([] as string[]).concat((lead.assignedPro as string[] | string | undefined) ?? []);
        if (!input.assignedPro.every((id) => current.includes(id))) {
          throw new ApiError({ code: 'FORBIDDEN', message: 'Only a manager can reassign a lead.' });
        }
      }
    }

    // Explicitly map input fields to NisLeads fields — never spread raw input
    const record: Record<string, any> = {};
    if (input.status !== undefined) record.status = input.status;
    if (input.closeReason !== undefined) record.closeReason = input.closeReason;
    if (input.leadDetails !== undefined) record.leadDetails = input.leadDetails;
    if (manager) {
      if (input.assignedPro !== undefined) record.assignedPro = input.assignedPro;
      if (input.dateAssigned !== undefined) record.dateAssigned = input.dateAssigned;
      if (input.customerName !== undefined) record.customerName = input.customerName;
      if (input.customerEmail !== undefined) record.customerEmail = input.customerEmail;
      if (input.customerPhone !== undefined) record.customerPhone = input.customerPhone;
      if (input.opportunityName !== undefined) record.opportunityName = input.opportunityName;
      if (input.assignmentNeeded !== undefined) record.assignmentNeeded = input.assignmentNeeded;
    }

    await NisLeads.update({ id: input.id, record });
    return { id: input.id, success: true };
  },
});
