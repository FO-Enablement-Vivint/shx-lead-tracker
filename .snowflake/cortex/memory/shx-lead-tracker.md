# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s3, wrap) · `main` · ownership checks now allow unchanged echoes; Self-Gen and audit-log endpoints guarded; `getLeadStats` deleted; roles compared only via `server/lib/roles.ts`; `getReps` returns `repId`; `--danger` tokens, `next/font` Inter, `.dark` removed. Gate green (typecheck, build, `authz:check`, registry, offline trace). **Never exercised in a real browser.**

## Gotchas
- `authz:check` and anything paging NIS Leads is slow (Airtable throttled to 5 req/s; each call takes seconds, the full script ~3 min). Run it in the background and poll a file; a foreground run looks hung and gets cancelled.
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted. Local `.env` writes to the **live** Airtable base. It still carries an unused `APP_USER_EMAIL`.
- Vercel env vars for this project are all Sensitive/hidden: `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel. `NPM_AUTH_TOKEN` is shared across Magistrate apps; Magistrate client ID/secret/session key are per-app.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; project sections live below its END marker only.
- The semantic-registry checker greps the whole repo on word boundaries, so don't add `bannedSynonyms` for "rep" or "user" — existing code names (`getReps`, `RepsContext`) would fail the gate.
- `neverStage` includes `.env.*`, which also matches the tracked, secret-free `.env.example`; stage it deliberately, never by glob.
- Pushing `main` triggers a Vercel deploy of `shx-lead-tracker.vercel.app`. `.snowflake/`, `docs/`, `CONTEXT.md`, `DESIGN.md` and `AGENTS.md` don't affect the build, but keep the build gate green before pushing.

## Next Session
- Browser-verified on the live deploy (Manager session, read-only): Lead Tracker, Manager View Team/Unassigned/Admin render with Inter and the new reds; `getReps` returns `repId` and no `proId`. **Still unverified:** any Pro-identity save (needs a Pro Okta login; `npm run authz:saves` covers the logic offline), the View-as dropdown contents, and Admin's "Recalculate counts" (38,982 unassigned leads at 5 req/s vs Vercel's function timeout; a live write, so not clicked).
- The browser tool inherits the user's Magistrate session; it can drive the Manager side but cannot sign in as a Pro.
