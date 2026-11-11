/**
 * Role and ownership checks for endpoints. `context.user.role` comes from the
 * user's SHX Team row, looked up on the server by the roster gate — never from
 * the request — so it can be trusted. The UI hides manager-only pages, but
 * hiding a button protects nothing on its own: each endpoint has to enforce it
 * too.
 *
 * Two different questions live here:
 *   - role:      may this person use a manager-only action at all?
 *   - ownership: is this lead (or its activity) theirs? A Pro may only see and
 *                touch leads assigned to them; a Manager may touch any.
 * Being on the roster answers neither, so endpoints that take a lead, an
 * activity or an `assignedPro` from the request must call these.
 */
import { Activities, NisLeads, SelfGenTime } from '../airtable/index';
import { ApiError, type RequestUser } from './endpoint';

export function isManager(user: RequestUser): boolean {
  return user.role === 'Manager';
}

/** Throws FORBIDDEN (HTTP 403) unless the caller is a manager. Fails closed. */
export function requireManager(user: RequestUser): void {
  if (!isManager(user)) {
    throw new ApiError({ code: 'FORBIDDEN', message: 'This action is for managers only.' });
  }
}

function forbidden(message: string): ApiError {
  return new ApiError({ code: 'FORBIDDEN', message });
}

/** Airtable link fields arrive as an array, a lone string, or nothing. */
function toIdList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return typeof value === 'string' && value ? [value] : [];
}

/**
 * Resolves whose leads a list/stats request is allowed to cover.
 *
 * A Manager may ask for any Pro's leads (the Manager View's "View as"), or
 * pass nothing for the whole table. A Pro must ask for their own — anything
 * else, including omitting it (which would fall into the whole-table path), is
 * refused rather than quietly rewritten.
 */
export function resolveAssignedPro(user: RequestUser, requested: string | undefined): string | undefined {
  if (isManager(user)) return requested;
  if (requested !== user.id) {
    throw forbidden('You can only view your own leads.');
  }
  return requested;
}

/** True when `user` is one of the lead's assigned Pros. */
export function ownsLead(user: RequestUser, lead: { assignedPro?: unknown }): boolean {
  return toIdList(lead.assignedPro).includes(user.id);
}

/**
 * Throws unless the caller may act on this lead: a Manager always may; a Pro
 * only if the lead is assigned to them. Fails closed on a missing lead.
 */
export async function requireLeadAccess(user: RequestUser, leadId: string): Promise<void> {
  if (isManager(user)) return;
  const lead = await NisLeads.findOne({ id: leadId });
  if (!lead || !ownsLead(user, lead)) {
    throw forbidden('That lead is not assigned to you.');
  }
}

/**
 * Throws unless the caller may act on this activity — that is, on the lead it
 * hangs off. Returns the activity so the caller does not have to re-read it.
 */
export async function requireActivityAccess(user: RequestUser, activityId: string) {
  const activity = await Activities.findOne({ id: activityId });
  if (!activity) {
    throw new ApiError({ code: 'NOT_FOUND', message: 'Activity not found' });
  }
  if (isManager(user)) return activity;

  const leadIds = toIdList(activity.relatedLead);
  for (const leadId of leadIds) {
    const lead = await NisLeads.findOne({ id: leadId });
    if (lead && ownsLead(user, lead)) return activity;
  }
  throw forbidden('That activity belongs to a lead that is not assigned to you.');
}

/**
 * A Pro may attribute an activity only to themselves (the Pro UI never sends
 * it); only a Manager may credit another rep. Returns the value to store.
 *
 * When editing, the form echoes back whoever the activity is already credited
 * to (the picker is hidden from Pros, so they cannot change it). Passing that
 * credit as `existing` lets the echo through while still refusing to add a
 * rep who is not already on the record.
 */
export function resolveActivityPro(
  user: RequestUser,
  requested: string[] | undefined,
  existing?: unknown,
): string[] | undefined {
  if (isManager(user) || requested === undefined) return requested;
  const current = toIdList(existing);
  if (requested.some((id) => id !== user.id && !current.includes(id))) {
    throw forbidden('You can only record activity as yourself.');
  }
  return requested;
}

/**
 * Throws unless the caller may act on this Self-Gen Time record: a Manager
 * always may; a Pro only if the record is linked to them. Returns the record.
 */
export async function requireSelfGenAccess(user: RequestUser, recordId: string) {
  const record = await SelfGenTime.findOne({ id: recordId });
  if (!record) {
    throw new ApiError({ code: 'NOT_FOUND', message: 'Activity not found' });
  }
  if (isManager(user)) return record;
  if (!toIdList(record.shxPro).includes(user.id)) {
    throw forbidden('That activity is not yours.');
  }
  return record;
}
