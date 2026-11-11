/**
 * Checks the ownership rules: who may see and touch whose leads.
 *
 *   npm run authz:check
 *
 * Read-only. It builds real users from the SHX Team roster and runs the read
 * endpoints and the ownership helpers the write endpoints call first. It never
 * calls a write endpoint, so even a broken rule cannot change data.
 */
import 'dotenv/config';
import { ShxTeam, NisLeads, Activities, SelfGenTime } from '../server/airtable/index';
import { requireRosterUser } from '../server/lib/roster';
import { ApiError, type RequestUser } from '../server/lib/endpoint';
import { requireLeadAccess, requireActivityAccess, requireSelfGenAccess, resolveActivityPro } from '../server/lib/access';
import getLeads from '../server/api/getLeads';
import getClosedLeads from '../server/api/getClosedLeads';
import getActivities from '../server/api/getActivities';

let failures = 0;

async function expect(label: string, want: 'allow' | 'forbid', run: () => Promise<unknown> | unknown): Promise<void> {
  let got: 'allow' | 'forbid' | string;
  try {
    await run();
    got = 'allow';
  } catch (err) {
    got = err instanceof ApiError && err.code === 'FORBIDDEN' ? 'forbid' : `error: ${(err as Error).message}`;
  }
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(58)} want ${want}, got ${got}`);
}

const ctx = (user: RequestUser) => ({ user, requestId: 'authz-check' });

async function userFor(email: string): Promise<RequestUser> {
  return requireRosterUser({ email });
}

async function main() {
  const team = await ShxTeam.findAll({ filters: { status: 'Active' }, limit: 100 });
  const manager = team.records.find((r) => r.role === 'Manager' && r.email);
  const pros = team.records.filter(
    (r) => r.role !== 'Manager' && r.email && Array.isArray(r.assignedLeads1) && r.assignedLeads1.length > 0,
  );
  if (!manager || pros.length < 2) {
    console.error('Need one active Manager and two active Pros with leads in the SHX Team table.');
    process.exit(1);
  }
  const mgr = await userFor(manager.email as string);
  const proA = await userFor(pros[0].email as string);
  const proB = await userFor(pros[1].email as string);
  console.log(`Manager ${mgr.id}, Pro A ${proA.id}, Pro B ${proB.id}\n`);

  const leadA = (proA.assignedLeads1 as string[])[0];
  const leadB = (proB.assignedLeads1 as string[])[0];

  console.log('Read endpoints');
  for (const [name, ep] of [
    ['getLeads', getLeads],
    ['getClosedLeads', getClosedLeads],
  ] as const) {
    const call = (user: RequestUser, assignedPro?: string) =>
      (ep as any).execute({ input: { assignedPro, limit: 1 }, context: ctx(user) });
    await expect(`${name}: Pro asks for another Pro`, 'forbid', () => call(proA, proB.id));
    await expect(`${name}: Pro omits assignedPro (whole table)`, 'forbid', () => call(proA));
    await expect(`${name}: Pro asks for own`, 'allow', () => call(proA, proA.id));
    await expect(`${name}: Manager views as a Pro`, 'allow', () => call(mgr, proA.id));
    await expect(`${name}: Manager omits assignedPro`, 'allow', () => call(mgr));
  }

  console.log('\nLead access (updateLead / createActivity / getActivities)');
  await expect('Pro on own lead', 'allow', () => requireLeadAccess(proA, leadA));
  await expect('Pro on another Pro\'s lead', 'forbid', () => requireLeadAccess(proA, leadB));
  await expect('Pro on a lead id that does not exist', 'forbid', () => requireLeadAccess(proA, 'recDOESNOTEXIST000'));
  await expect('Manager on any lead', 'allow', () => requireLeadAccess(mgr, leadB));
  await expect('getActivities: Pro on own lead', 'allow', () =>
    (getActivities as any).execute({ input: { leadId: leadA, limit: 1 }, context: ctx(proA) }));
  await expect('getActivities: Pro on another Pro\'s lead', 'forbid', () =>
    (getActivities as any).execute({ input: { leadId: leadB, limit: 1 }, context: ctx(proA) }));

  console.log('\nActivity access (updateActivity / deleteActivity)');
  // Start from a real activity and work back to the Pro who owns its lead, so
  // the check does not depend on which leads the sampled Pros happen to have.
  const sample = await Activities.findAll({ limit: 25 });
  let act: { id: string; ownerId: string } | null = null;
  for (const a of sample.records) {
    const leadId = (a.relatedLead as string[] | undefined)?.[0];
    const lead = leadId ? await NisLeads.findOne({ id: leadId }) : null;
    const ownerId = (lead?.assignedPro as string[] | undefined)?.[0];
    if (ownerId) {
      act = { id: a.id, ownerId };
      break;
    }
  }
  if (act) {
    const ownerRec = await ShxTeam.findOne({ id: act.ownerId });
    const owner = ownerRec?.email ? await userFor(ownerRec.email as string) : null;
    const intruder = [proA, proB].find((p) => p.id !== act!.ownerId);
    if (owner && intruder) {
      await expect('Pro on activity of own lead', 'allow', () => requireActivityAccess(owner, act!.id));
      await expect('Pro on activity of another Pro\'s lead', 'forbid', () => requireActivityAccess(intruder, act!.id));
      await expect('Manager on any activity', 'allow', () => requireActivityAccess(mgr, act!.id));
    } else {
      console.log('  skip  could not build owner/intruder users for the sampled activity');
    }
  } else {
    console.log('  skip  no activity with an assigned lead found in the first 25');
  }

  console.log('\nActivity attribution');
  await expect('Pro credits self', 'allow', () => resolveActivityPro(proA, [proA.id]));
  await expect('Pro credits nobody', 'allow', () => resolveActivityPro(proA, undefined));
  await expect('Pro credits another rep', 'forbid', () => resolveActivityPro(proA, [proB.id]));
  await expect('Manager credits another rep', 'allow', () => resolveActivityPro(mgr, [proB.id]));
  await expect('Pro edit echoes the existing credit (another rep)', 'allow', () => resolveActivityPro(proA, [proB.id], [proB.id]));
  await expect('Pro edit adds a rep not already credited', 'forbid', () => resolveActivityPro(proA, [proB.id], [proA.id]));

  console.log('\nSelf-Gen access (updateSelfGenActivity)');
  const sg = await SelfGenTime.findAll({ limit: 25 });
  const sgRec = sg.records.find((r) => Array.isArray(r.shxPro) && r.shxPro.length > 0);
  if (sgRec) {
    const ownerId = (sgRec.shxPro as string[])[0];
    const sgOwner = [proA, proB, mgr].find((u) => u.id === ownerId);
    const sgOther = [proA, proB].find((u) => u.id !== ownerId);
    if (sgOwner && sgOther) {
      await expect('Pro on own Self-Gen record', 'allow', () => requireSelfGenAccess(sgOwner, sgRec.id));
    }
    if (sgOther) await expect('Pro on another Pro\'s Self-Gen record', 'forbid', () => requireSelfGenAccess(sgOther, sgRec.id));
    await expect('Manager on any Self-Gen record', 'allow', () => requireSelfGenAccess(mgr, sgRec.id));
  } else {
    console.log('  skip  no Self-Gen record with a Pro in the first 25');
  }

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
