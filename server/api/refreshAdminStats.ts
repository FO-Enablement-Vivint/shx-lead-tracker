import { z } from 'zod';
import { createEndpoint } from '../lib/endpoint';
import { ControlPanel } from '../airtable/index';

export default createEndpoint({
  description:
    'Starts a recount of the pipeline numbers by ticking Refresh Counts on the Control Panel record. The Airtable "Refresh Admin Counts" automation does the counting and unticks the box; poll getAdminStats until refreshing is false.',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({ started: z.boolean() }),
  execute: async () => {
    const panel = await ControlPanel.findOne({});
    if (!panel) throw new Error('Control Panel record not found');

    await ControlPanel.update({ id: panel.id, record: { refreshCounts: true } });
    return { started: true };
  },
});
