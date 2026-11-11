<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SHX Leads Tracker

## Commands

- `npm run dev` — Next dev server on :3000 (needs `.env`; see `.env.example`)
- `npm run typecheck` / `npm run build` — the quality gate
- `npm run schema:generate` — regenerate `server/airtable/schema.generated.ts` from the live base
- `npm run auth:check`, `npm run authz:check`, `npm run db:check` — roster-gate, ownership (read-only, live roster) and login-log sanity scripts
- `npm run authz:saves` — offline (stubbed Airtable, runs in seconds, no `.env` needed): real endpoints with the exact UI payloads; run it after touching an ownership rule or a form's payload

## Conventions

- New endpoints go in `server/api/<name>.ts` and must be registered in `server/api/index.ts`. Manager-only endpoints must also be added to `managerEndpoints` there.
- The Manager View's CSS (`src/manage/manage.css`) is scoped under `.manage` with `--m-*` variables; keep it from restyling the Pro app.
- Any endpoint that takes a lead id, activity id or `assignedPro` from the request must check ownership with the helpers in `server/lib/access.ts` (a Pro sees only their own leads; a mismatch is a 403). The roster gate does not do this. Add a case to `scripts/check-authz.ts` and run `npm run authz:check`, plus one to `scripts/check-pro-saves.ts` if a form sends the field.
- Local `.env` points at the live Airtable base — writes are real.
- Compare roles only through `server/lib/roles.ts` (`isManagerRole`/`isProRole`, or `isManager`/`isPro` in `access.ts`); never a bare `role === 'Manager'`. `proId` always means the Airtable record id; the Rep ID formula is `repId`.
- Show an Airtable date field with `formatDate` (`src/utils/formatters.ts`), never `new Date(value).toLocaleDateString()`: a date-only `YYYY-MM-DD` parses as UTC midnight and displays a day early in the US. Timestamps (Exports `createdTime`, Self-Gen) are real instants and are fine either way.
- A Pro's forms submit manager-only fields back unchanged (e.g. `assignedPro`), so an ownership check must compare against the stored value and refuse only a *new* value; comparing to the caller 403s legitimate saves. See `resolveActivityPro` and `updateLead`.

## Architecture

See `README.md` (layout, access model, Airtable layer) and `MIGRATION.md` (history, auth and ownership).
