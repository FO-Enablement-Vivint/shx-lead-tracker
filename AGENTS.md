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
- `npm run auth:check`, `npm run authz:check`, `npm run db:check` — roster-gate, ownership (read-only) and login-log sanity scripts

## Conventions

- New endpoints go in `server/api/<name>.ts` and must be registered in `server/api/index.ts`. Manager-only endpoints must also be added to `managerEndpoints` there.
- The Manager View's CSS (`src/manage/manage.css`) is scoped under `.manage` with `--m-*` variables; keep it from restyling the Pro app.
- Any endpoint that takes a lead id, activity id or `assignedPro` from the request must check ownership with the helpers in `server/lib/access.ts` (a Pro sees only their own leads; a mismatch is a 403). The roster gate does not do this. Add a case to `scripts/check-authz.ts` and run `npm run authz:check`.
- Local `.env` points at the live Airtable base — writes are real.

## Architecture

See `README.md` (layout, access model, Airtable layer) and `MIGRATION.md` (history, auth and ownership).
