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
- Browser smoke-test on the deployed site. As a **Pro** (private window; Magistrate has no logout): change a status, add a note, log an activity, edit an activity credited to another rep. As a **Manager**: reassign a lead, "View as" a Pro (picker lists Pros, not you; that Pro's own activities are now editable), and eyeball Admin/Team/Unassigned (red buttons, font).
