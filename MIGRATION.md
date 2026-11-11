# Migration notes

Two migrations happened. **Zite → standalone** (2026-09-28) replaced the hosted
Zite runtime with our own code. **Vite/Express → Next.js** (2026-09-29)
replaced the framework.

Authentication was removed in the second migration and later replaced with
Magistrate sign-in plus a roster gate — see *Authentication* at the end.

## Zite → standalone

What was replaced and where the seams are.

| Zite module | Replacement |
| --- | --- |
| `zitejs/backend` `createEndpoint`, `ZiteError` | `server/lib/endpoint.ts` (`createEndpoint`, `ApiError`; `ZiteError` alias kept) |
| `zitejs/integrations` table clients + record types | `server/airtable/index.ts` + `schema.generated.ts` (generated from the live base) |
| `zitejs/api` typed client | `src/lib/api.ts` (types inferred from `server/api`) |
| `zitejs/auth` `useAuth`, `loginWithRedirect`, `logout` | Magistrate sign-in (see *Authentication*); there was a gap with none in between |
| `zitejs/upload` `uploadFile` | `src/lib/upload.ts` + `app/api/upload/route.ts` (bytes go straight into the record's Airtable cell) |
| `zitejs/db` (`zite.loginEvents`, `zite.sql`) | `server/lib/db.ts` — SQLite at first, now Neon Postgres |
| `context.user` enrichment | unchanged: `server/lib/currentUser.ts` still copies the SHX Team row onto `context.user` |
| `ZITE_OPENAI_ACCESS_TOKEN` | `OPENAI_API_KEY` (old name still read as a fallback) |

Files moved out of `src/` because they only run on the server:
`src/api/*` → `server/api/*`, `src/lib/currentUser.ts`, `src/lib/openai.ts` →
`server/lib/`, `src/utils/leadUtils.ts` → `server/utils/`.

## Things to verify against the old app

- **Button fields.** `resetLead` (NIS Leads → "Reset Lead") and `loadLeads`
  (SHX Team → "Load Leads") are *button* fields in Airtable. The endpoints
  write `true` to them, as they did before. Airtable's REST API does not accept
  writes to button fields, so if these actions error, the fix is to point the
  automation trigger at a checkbox field and update the two endpoints.
- **Record order.** Queries run without a view, so Airtable returns records in
  the table's default order. Nothing relies on that order for counts anymore:
  `refreshAdminStats` ticks Refresh Counts and the Airtable automation counts
  the `Unassigned Leads` and `_SYSTEM_RAW_INTAKE` views.
- **Attachments.** Files are uploaded straight into the record's Attachments cell
  through Airtable's upload endpoint, so nothing is hosted here. Airtable caps
  files at 5 MB and Vercel caps request bodies at 4.5 MB, so the route allows
  4 MB per file. The record has to exist first: the Self-Gen forms save, then
  upload, and show a retry button if an upload fails.
- **Login history.** Login events now go to a `login_events` table in Neon
  (`DATABASE_URL`). They began in SQLite, which could not work on Vercel — each
  serverless instance had its own copy under `/tmp`. The old platform DB's
  history was never migrated, so counts start from the Neon switch.
## Vite/Express → Next.js

Everything that held business logic moved unchanged: the 31 endpoint files (34 today),
the Airtable adapter and generated schema, the SHX Team roster and role gating,
and the whole dashboard UI. What changed is the shell around them.

| Before | After |
| --- | --- |
| Vite dev server + `index.html` + `src/main.tsx` | Next App Router: `app/layout.tsx`, `app/page.tsx` |
| Express app (`server/app.ts`, `server/index.ts`, `api/index.ts`) | Route handlers under `app/api/` |
| Express dispatcher for `POST /api/:name` | `app/api/[name]/route.ts` (same contract) |
| `express.static` for `/uploads` | removed — attachments are no longer hosted by the app |
| Home-grown email sign-in (`server/lib/auth.ts`, `src/components/LoginScreen.tsx`) | removed at the time; Magistrate later replaced it |
| Signed session cookie (`server/lib/session.ts`) | `session.ts` briefly built `context.user` from `APP_USER_EMAIL`; since removed — `server/lib/roster.ts` builds it now |
| `vercel.json` rewrites to one Express function | none — Next on Vercel is zero-config |
| React 18 | React 19 |

Notes on the seams (as of this migration; superseded by *Authentication* below):

- **`context.user` is unchanged in shape.** `APP_USER_EMAIL` supplies the
  email; `enrichCurrentUser` still copies the SHX Team row on top, so
  `context.user.id` is the Airtable record id and `role` works as before.
- **Roster gating still lives in the app.** The configured email must exist in
  SHX Team and not be Inactive, or the app shows Access Denied — which now
  reads as a configuration error rather than a rejected sign-in.
- **Node ESM `.js` import extensions were removed** from `server/**`. They were
  needed when the server ran under `tsx`; Next bundles it instead.
- **`AUTH_MODE`, `SESSION_SECRET`, `SESSION_TTL_HOURS`, `WEB_URL` and the
  `OIDC_*` variables are gone**, replaced by `APP_USER_EMAIL`.
- **The Sign Out control was removed** from the sidebar and mobile menu, since
  there is no session to end.

## Authentication

Sign-in is Magistrate (Field Pro Mobile Okta). Authorization is separate and
lives in `server/lib/roster.ts`: `requireRosterUser` refuses any session whose
email is not an active row in the SHX Team table, and both route handlers call
it before dispatch. Endpoints therefore receive a `context.user` that already
carries the roster row, and `enrichCurrentUser` is now a no-op in that path —
it is kept so the endpoint files stay unchanged.

### Previously (removed)

For a period there was no sign-in. `requestUser()` in `server/lib/session.ts`
returned a user built from `APP_USER_EMAIL`, so every request was served as that
one person and anyone who reached the server got their access. `session.ts` and
`APP_USER_EMAIL` are both gone; Magistrate supplies the email and
`requireRosterUser` turns it into `context.user`. Authorization did not move —
the SHX Team row still decides role and assigned leads.

Magistrate (`@FO-Enablement-Vivint/magistrate`, Field Pro Mobile Okta) requires
Next.js and React 19, a GitHub token with `read:packages` to install, and
authorization from the Enablement team. It ships no logout and its sessions are
fixed at 8 hours.

### Ownership (added 2026-11-11)

The roster gate decides who may use the app, not whose data they may ask for.
Until this date `getLeads`, `getClosedLeads`, `getLeadStats`, `updateLead`,
`getActivities`, `createActivity`, `updateActivity` and `deleteActivity` trusted
the client: a signed-in Pro could read every lead, or edit and reassign any
lead, by passing a different id or omitting `assignedPro`. They now go through
the helpers in `server/lib/access.ts`. A mismatch is a 403, not a silent
rewrite. `npm run authz:check` verifies it against the live roster.
