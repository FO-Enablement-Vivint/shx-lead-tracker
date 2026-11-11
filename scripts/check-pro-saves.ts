/**
 * Offline check of the Pro-side saves:
 *
 *   npm run authz:saves
 *
 * Runs the real endpoint code with the exact payloads the UI components send
 * (QuickStatusChange, LeadForm, ActivityForm, the Self-Gen dialogs), with the
 * Airtable tables replaced by in-memory stubs. It never touches the network or
 * the live base, so it is fast and safe to run anywhere. It answers "does a
 * legitimate save still work, and is an illegitimate one still refused?";
 * `authz:check` answers the same against the live roster. When a form starts
 * sending a new field, or an endpoint gains a rule, add a case here.
 */
import { NisLeads, Activities, SelfGenTime, AuditLog, ShxTeam } from '../server/airtable/index';
import type { RequestUser } from '../server/lib/endpoint';
import updateLead from '../server/api/updateLead';
import assignLead from '../server/api/assignLead';
import createActivity from '../server/api/createActivity';
import updateActivity from '../server/api/updateActivity';
import updateSelfGenActivity from '../server/api/updateSelfGenActivity';
import logAuditEvent from '../server/api/logAuditEvent';

const A = 'recProA00000000A', B = 'recProB00000000B', M = 'recMgr00000000M';
const mkUser = (id: string, role: string): RequestUser => ({ id, email: `${id}@x.test`, roles: [], role });
const proA = mkUser(A, 'Pro'), proB = mkUser(B, 'Pro'), mgr = mkUser(M, 'Manager');

const leads: Record<string, any> = {
  L1: { id: 'L1', assignedPro: [A] },
  L2: { id: 'L2', assignedPro: [B] },
  L3: { id: 'L3', assignedPro: [A, B] },
  L4: { id: 'L4', assignedPro: undefined },
};
const acts: Record<string, any> = {
  ACT1: { id: 'ACT1', relatedLead: ['L1'], assignedPro: [A] },
  ACT2: { id: 'ACT2', relatedLead: ['L1'], assignedPro: [B] },
  ACT3: { id: 'ACT3', relatedLead: ['L2'], assignedPro: [B] },
};
const selfgen: Record<string, any> = { SG_A: { id: 'SG_A', shxPro: [A] }, SG_B: { id: 'SG_B', shxPro: [B] } };

let writes: any[] = [];
(NisLeads as any).findOne = async ({ id }: any) => leads[id] ?? null;
(NisLeads as any).update = async (o: any) => { writes.push(['NisLeads.update', o.id, o.record]); return o; };
(Activities as any).findOne = async ({ id }: any) => acts[id] ?? null;
(Activities as any).update = async (o: any) => { writes.push(['Activities.update', o.id, o.record]); return o; };
(Activities as any).create = async (o: any) => { writes.push(['Activities.create', o.record]); return { id: 'NEW' }; };
(SelfGenTime as any).findOne = async ({ id }: any) => selfgen[id] ?? null;
(SelfGenTime as any).update = async (o: any) => { writes.push(['SelfGen.update', o.id, o.record]); return o; };
(AuditLog as any).create = async (o: any) => { writes.push(['AuditLog.create', o.record]); return { id: 'AUD' }; };
(ShxTeam as any).findOne = async ({ id, filters }: any) =>
  id ? { id, status: 'Active' } : filters?.email === `${B}@x.test` ? { id: B } : filters?.email === `${A}@x.test` ? { id: A } : null;

let failures = 0;
async function run(label: string, want: 'allow' | 'forbid', ep: any, user: RequestUser, payload: any, expectWrites?: (w: any[]) => boolean) {
  writes = [];
  let got: string;
  try {
    const input = ep.inputSchema.parse(JSON.parse(JSON.stringify(payload))); // what survives the wire
    await ep.execute({ input, context: { user, requestId: 't' } });
    got = 'allow';
  } catch (e: any) {
    got = e?.code === 'FORBIDDEN' ? 'forbid' : `error: ${e?.message}`;
  }
  const writeOk = got !== 'allow' || !expectWrites || expectWrites(writes);
  const ok = got === want && writeOk;
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(66)} want ${want}, got ${got}${writeOk ? '' : ' (wrong writes: ' + JSON.stringify(writes) + ')'}`);
}

const formPayload = (id: string, assignedPro: string[] | undefined, extra: any = {}) => ({
  id, status: 'IN-PROGRESS | Contacted', assignedPro, dateAssigned: undefined,
  opportunityName: 'Opp', customerName: 'Cust', customerPhone: '555', customerEmail: 'c@x.com',
  leadDetails: 'a note', assignmentNeeded: false, ...extra,
});
const onlyKeys = (w: any[], keys: string[]) => w.length === 1 && Object.keys(w[0][2]).every((k) => keys.includes(k));

async function main() {
  console.log('Pro saves');
  await run('QuickStatusChange on own lead', 'allow', updateLead, proA, { id: 'L1', status: 'NEW', closeReason: undefined }, (w) => onlyKeys(w, ['status']));
  await run('LeadForm (status + note) on own lead', 'allow', updateLead, proA, formPayload('L1', [A]), (w) => onlyKeys(w, ['status', 'leadDetails']));
  await run('LeadForm with close reason on own lead', 'allow', updateLead, proA, formPayload('L1', [A], { status: 'CLOSED | Lost', closeReason: 'x' }), (w) => onlyKeys(w, ['status', 'leadDetails', 'closeReason']));
  await run('LeadForm on a co-assigned lead (form sends only first pro)', 'allow', updateLead, proA, formPayload('L3', [A]));
  await run('Create activity on own lead (no attribution sent)', 'allow', createActivity, proA, { relatedLead: 'L1', date: '2026-11-11', type: 'Note', content: 'hi' });
  await run('Edit own activity (echoes credited pro = self)', 'allow', updateActivity, proA, { activityId: 'ACT1', type: 'Note', content: 'x', date: '2026-11-11', assignedPro: [A] });
  await run('Edit activity credited to another rep (form echoes it)', 'allow', updateActivity, proA, { activityId: 'ACT2', type: 'Note', content: 'x', date: '2026-11-11', assignedPro: [B] });

  console.log('\nPro must still be refused');
  await run('updateLead on another Pro\'s lead', 'forbid', updateLead, proA, { id: 'L2', status: 'NEW' });
  await run('updateLead reassigning own lead to someone else', 'forbid', updateLead, proA, { id: 'L1', assignedPro: [B] });
  await run('createActivity on another Pro\'s lead', 'forbid', createActivity, proA, { relatedLead: 'L2', date: 'd', type: 'Note', content: 'x' });
  await run('createActivity crediting another rep', 'forbid', createActivity, proA, { relatedLead: 'L1', date: 'd', type: 'Note', content: 'x', assignedPro: [B] });
  await run('updateActivity on another Pro\'s lead', 'forbid', updateActivity, proA, { activityId: 'ACT3', content: 'x' });
  await run('updateActivity changing credit to another rep', 'forbid', updateActivity, proA, { activityId: 'ACT1', assignedPro: [B] });

  console.log('\nManager');
  await run('Reassign L1 -> B via LeadForm', 'allow', updateLead, mgr, formPayload('L1', [B], { dateAssigned: undefined }), (w) => w[0][2].assignedPro?.[0] === B);
  await run('Assign unassigned lead (Manager View)', 'allow', assignLead, mgr, { leadId: 'L4', proId: A }, (w) => w[0][2].assignedPro?.[0] === A);
  await run('Manager edits any activity, re-credits it', 'allow', updateActivity, mgr, { activityId: 'ACT3', assignedPro: [A] });

  console.log('\nSelf-Gen / audit (audit targets)');
  await run('Pro updates own Self-Gen record', 'allow', updateSelfGenActivity, proA, { id: 'SG_A', completed: true });
  await run('Pro updates ANOTHER Pro\'s Self-Gen record', 'forbid', updateSelfGenActivity, proA, { id: 'SG_B', completed: true });
  await run('Manager updates any Self-Gen record', 'allow', updateSelfGenActivity, mgr, { id: 'SG_B', completed: true });
  await run('Audit event attributed to the caller, not a client-supplied email', 'allow', logAuditEvent, proA,
    { action: 'Update Lead', leadId: 'L1', details: 'd', userName: 'Spoof', userEmail: `${B}@x.test` },
    (w) => w[0][0] === 'AuditLog.create' && w[0][1].assignedPro?.[0] === A);

  await run('Audit event about a lead the caller cannot access', 'forbid', logAuditEvent, proA, { action: 'View Lead', leadId: 'L2' });
  await run('Audit event with no lead (e.g. Delete Compensation)', 'allow', logAuditEvent, proA, { action: 'Delete Compensation', details: 'x' });
  await run('Manager audit event about any lead', 'allow', logAuditEvent, mgr, { action: 'View Lead', leadId: 'L2' });

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
