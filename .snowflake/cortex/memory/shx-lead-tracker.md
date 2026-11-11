# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s3, wrap) · `main` · ownership checks allow unchanged echoes; Self-Gen and audit-log endpoints guarded; `getLeadStats` deleted; roles compared only via `server/lib/roles.ts`; `getReps` returns `repId`; `--danger` tokens, `next/font` Inter, `.dark` removed; date-only fields shown via `formatDate`; Admin "Recalculate counts" now ticks the new Control Panel checkbox `Refresh Counts` (`fldP89ECIoC4M3fsr`) and the Airtable automation "Refresh Admin Counts" (`wflJUtakpR1SeJVEc`, on, tested: 12s, 53,227 unassigned / 0 raw) rewrites the counts; the page polls `getAdminStats`. Gate green. Pushed through `2e826e5`.

## Gotchas
- `authz:check` and anything paging NIS Leads is slow (Airtable throttled to 5 req/s; each call takes seconds, the full script ~3 min). Run it in the background and poll a file; a foreground run looks hung and gets cancelled.
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted. Local `.env` writes to the **live** Airtable base. It still carries an unused `APP_USER_EMAIL`. No `AIRTABLE_API_KEY` locally, so `npm run schema:generate` fails; `schema.generated.ts` was edited by hand for `refreshCounts` (regenerate when a key is available).
- Vercel env vars for this project are all Sensitive/hidden: `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel. `NPM_AUTH_TOKEN` is shared across Magistrate apps; Magistrate client ID/secret/session key are per-app.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; project sections live below its END marker only.
- The semantic-registry checker greps the whole repo on word boundaries, so don't add `bannedSynonyms` for "rep" or "user" — existing code names (`getReps`, `RepsContext`) would fail the gate.
- `neverStage` includes `.env.*`, which also matches the tracked, secret-free `.env.example`; stage it deliberately, never by glob.
- Pushing `main` triggers a Vercel deploy of `shx-lead-tracker.vercel.app`. `.snowflake/`, `docs/`, `CONTEXT.md`, `DESIGN.md` and `AGENTS.md` don't affect the build, but keep the build gate green before pushing.
- The Airtable MCP can read and write the live base (Control Panel, automations, runs), which is how automations here get built and verified. The cached Control Panel count had drifted (38,982 vs real 53,227) until the first refresh.

## Next Session
- On the deployed site: click Admin "Recalculate counts" (should show 53,227 within seconds), and re-check an activity date and a lead's Assigned date for the `formatDate` fix.
- Still unverified in a real browser: any save made with a real Pro identity (covered offline by `npm run authz:saves`). The browser tool inherits the user's Manager session, can drive View-as (Radix selects open via a dispatched `pointerdown`), cannot sign in as a Pro, and a reload clears the in-memory proxy.
