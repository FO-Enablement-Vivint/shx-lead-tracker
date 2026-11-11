# shx-lead-tracker — Domain Vocabulary

Derived from the code on 2026-11-11. Airtable is the system of record; the
Airtable automations are not in this repo, so anything they do is inferred
from code comments. Where the code uses two words for one concept, both are
listed so new code can pick the canonical one.

## Glossary

### People and access

| Term | Definition | Avoid |
|---|---|---|
| SHX Team (roster) | The Airtable table of everyone allowed in the app; a request is refused with 403 unless the session email has a non-Inactive row. | |
| Pro | A field rep in SHX Team (`role === 'Pro'`) who owns leads; only a Pro with Status `Active` and Skip Load Leads unchecked can receive loaded leads. | |
| Manager | A user with `role === 'Manager'`, who gets the Manager View, the manager-only endpoints, all compensation, and "View as". | |
| Rep | Legacy synonym for Pro that survives in code names (`getReps`, `RepsContext`, the Rep ID formula, the `'Rep not found'` error); prefer "Pro" in new code and UI copy. | |
| Roster Status | `Active`, `Inactive` or `Reverted`; only `Inactive` is blocked at the gate. | |
| Proxy ("View as") | Client-side mode where a Manager sees the Pro UI as another Pro; the sidebar's "My View" exits it. | |

### Leads

| Term | Definition | Avoid |
|---|---|---|
| Lead | One row in the NIS Leads table (what "NIS" stands for is not stated in code). | |
| Lead Type | `Ready to Assign`, `Active` or `Closed`; a lead with no Lead Type is raw intake. | |
| Unassigned | Leads with Lead Type `Ready to Assign`, the pool that loading and distribution draw from. | |
| Raw intake | Leads with no Lead Type, waiting for the Process New Uploads automation; not counted as Unassigned. | |
| Lead Status | The workflow state: `NEW`, `IN-PROGRESS \| <reason>` or `CLOSED \| <reason>`. | |
| Sold | A lead whose Status is `CLOSED \| Sold/Scheduled` or `CLOSED \| Installed`; the "closed" stat excludes these. | |
| Close Reason | Free text required when a lead moves into a `CLOSED` status. | |
| Assigned Pro | The Pro linked to a lead; an Airtable automation re-stamps Status and Date Assigned whenever it changes. | |
| Original Assigned Pro | Text field that, when non-empty (or when Close Reason is set), marks a lead as previously worked and not loadable. | |
| Activity | A row in Activities linked to a lead: type (Call, Text or Note), date, content and optional follow-up date. | |

### Loading and clawing back leads

| Term | Definition | Avoid |
|---|---|---|
| Load Leads | Tops a Pro up to their Daily New Lead Cap without exceeding their Active Lead Cap; the app version of the Airtable "Single-Pro Loader" button. | |
| Load NEW CAP | Load Leads with a one-off daily cap of 1-500 (spelled "New Cap" in file and endpoint names). | |
| Daily New Lead Cap / Active Lead Cap | Per-Pro limits on leads assigned today and leads currently Active; defaults are 10 and 150 when blank. | |
| Buckets | The eight territory-matching tiers loading draws from, from exact city out to a 100-mile state backstop; leads older than 75 days are excluded. | |
| Zip centroids | Static ZIP-to-lat/lng data copied from the Airtable "ZIP Centroids" table, refreshed with `npm run zips:sync`. | |
| Reclaim Leads | Returns a Pro's Active, `NEW` leads assigned more than 14 days ago to Ready to Assign. | |
| Force Reclaim | Reclaim for every `NEW` lead of any age or Lead Type, which also sets Assignment Needed. | |
| Revert Pro | Sets roster Status to `Reverted` and stamps Reversion Date; leads are untouched and the Pro keeps app access. | |
| Offboard Pro | Force-style reclaim of `NEW` leads, then sets the Pro Inactive with both caps at 0. | |
| Distribute Leads | Manager View button that ticks Run Distribution on the Control Panel to start an Airtable automation; the app assigns nothing itself. | |
| Process New Uploads | Same pattern for turning raw intake into leads (UI text calls it the "New Lead Intake automation"). | |
| Leftover leads | Leads still unassigned after distribution, flagged by the Mark Leftover Leads automation. | |
| Control Panel | Single-row Airtable table of automation trigger checkboxes and cached counts. | |
| Audit Log | Airtable table of manager actions that also carries each action's undo data (see Decisions). | |

### Pro-facing records

| Term | Definition | Avoid |
|---|---|---|
| Self-Gen | A Pro's logged time on self-generated work not tied to a lead: a 30-minute slot, 1-2 activity types, a Completed flag, notes and attachments. | |
| Compensation | Per-deal comp records, stored in the Exports table; Pros see only their own, Managers see all. | |
| Running totals | The Running Comp Total rollup on SHX Team, summed into a grand total (Managers excluded). | |
| Manager View | The separate dark-themed area at `/manage` with Unassigned, Team, Admin and Logins pages. | |
| Login events | Neon `login_events` rows, one per sign-in (deduped within 4 hours), feeding the login report. | |

## Known vocabulary inconsistencies

Recorded so they are not mistaken for distinct concepts. None are fixed yet.

- **Pro / Rep / User / SHX** all mean a roster member. The Exports and Self-Gen tables say "SHX Name", "SHX Email" and "SHX Pro"; the compensation UI says "All Users", "All Pros" and "Selected Rep".
- **`proId` is two different ids.** Mutating endpoints take the Airtable record id, but `getReps` returns the Rep ID formula value as `proId`.
- **"Active" means three things:** Lead Type `Active`, roster Status `Active`, and the Leads tab (NEW + IN-PROGRESS only).
- **"Closed" means two things:** Lead Type `Closed` and a Status starting `CLOSED |`. (A third, the "closed" stat that excluded sold leads, lived only in `getLeadStats` and went when it was deleted.)
- **Role checks are written two ways:** `role === 'Pro'` and `role !== 'Manager'`. A third role would be treated differently by each.
- **Compensation vs Exports:** the UI says Compensation, the Airtable table is Exports.
- **Activities has several names:** Activities, Notes/Interactions, Lead Interactions, # Interactions.

## Decisions

### Ownership checks must allow an echo of the existing value — 2026-11-11
- **Context:** After the first ownership push, an offline trace of the Pro saves (real endpoint code, exact UI payloads, stubbed Airtable) found two false refusals. `ActivityForm` echoes back the activity's current credited rep, and `LeadForm` echoes only the first owner of a lead; both tripped checks written as "must equal the caller / must equal the stored list". 905 of ~19,800 live activities are credited to someone other than the lead's current owner, so a Pro editing one would have got a 403. The same audit found `updateSelfGenActivity` had no ownership check and `logAuditEvent` trusted a client-supplied email.
- **Decision:** `resolveActivityPro` takes the stored credit as `existing` and refuses only a rep who is not already on the record; `updateLead` refuses a Pro only when the submitted owner list contains someone not already assigned. `requireSelfGenAccess` guards `updateSelfGenActivity`. `logAuditEvent` attributes the row to `context.user` and ignores `userEmail`/`userName`. `getLeadStats` is deleted: nothing called it and it paged the whole table.
- **Why:** The Pro UI hides manager-only fields but still submits them, so a rule that compares them to the caller breaks legitimate saves, while a rule that compares them to the stored value cannot grant anything new. `getRunningTotals` and `getCompensation` were audited and are sound (a Pro is forced to their own id server-side).

### Ownership is enforced per endpoint, and a mismatch is a 403 — 2026-11-11
- **Context:** The roster gate only decides who may use the app. `getLeads`, `getClosedLeads`, `getLeadStats`, `updateLead` and the activity endpoints trusted a client-supplied `assignedPro` / lead id, so a signed-in Pro could read the whole table or edit and reassign any lead.
- **Decision:** `server/lib/access.ts` holds the rules (`resolveAssignedPro`, `requireLeadAccess`, `requireActivityAccess`, `resolveActivityPro`). A Pro may only list, edit or log activity on leads assigned to them; a Manager may act on any. Asking for someone else's data is refused with 403 rather than quietly rewritten to the caller's own id. For `updateLead` a Pro's write is limited to status, close reason and lead details; the form submits the manager-only fields unchanged, so those are dropped, but an actual change of Assigned Pro is a 403.
- **Why:** Silent coercion would hide misuse and mask client bugs, and the legitimate client never sends a mismatched id. Ownership is per-endpoint (unlike the roster gate), so a new endpoint taking a lead, activity or `assignedPro` is open until it calls these. `npm run authz:check` verifies it read-only against the live roster.

### Airtable stays the system of record, and its automations are part of the behavior — 2026-11-11
- **Context:** The lead loaders are ports of Airtable button scripts, and Distribute, Process Uploads and Mark Leftovers only tick Control Panel checkboxes.
- **Decision:** Keep business logic in step with the Airtable side rather than replacing it, and write lead changes in two phases when Assigned Pro changes.
- **Why:** An Airtable automation re-stamps Status and Date Assigned whenever Assigned Pro changes (including when it is cleared), so a single "obvious" update silently loses fields. The app waits up to 90 seconds for the automation. The logic now lives in two places and must be kept aligned.

### A Reverted Pro is not an Inactive Pro — 2026-10-02
- **Context:** Revert Pro and Offboard Pro look similar but have opposite effects on access.
- **Decision:** Revert sets Status `Reverted`, keeps the Pro's leads and app access; only `Inactive` is blocked at the roster gate, and only Offboard makes a Pro Inactive.
- **Why:** Reverting is a compensation-side correction, not a termination; anyone reading "revert" as "deactivate" gets it wrong.

### Authorization is the SHX Team roster, with a 60-second cache and a server-trusted role — 2026-11-11
- **Context:** Magistrate proves identity for any Field Pro Mobile user, which is far wider than the people who may use this app.
- **Decision:** Every `/api/*` call re-checks the roster before dispatch, and `role` comes from the roster row, never from the request. Roster rows are cached for 60 seconds.
- **Why:** The UI hiding a button protects nothing on its own. The cost is that deactivations and role changes take up to a minute to apply.

### The Audit Log doubles as the undo journal, and undo is a CLI — 2026-11-11
- **Context:** Manager actions (load, reclaim, offboard, revert) change many records and may need reversing.
- **Decision:** Each action appends an `UNDO-DATA {json}` line, with before-values, to the free-text Details field of its Audit Log row; restoring is `npm run leads:undo -- <auditLogId> [--apply]`.
- **Why:** An offboarded Pro can no longer sign in, so undo cannot be a Pro-facing feature. The JSON is versioned (`v: 2`), so old entries must stay readable.
