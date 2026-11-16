# Kente

Kente is a programme and project management web app for organisations that deliver programmes: NGOs, development agencies, corporates, accelerators and venture studios. Its core idea: every task is tied to a programme outcome (a Metric), so daily work always rolls up to results.

## Modules
Dashboard, Stakeholders, Vault, Log, Metric, Reporting, Import. Kente Pulse is the AI weekly brief on the Dashboard. See docs/PRD.md for full requirements and docs/TECH-SPEC.md for the data model and build order. docs/PROGRESS.md records which slices are done and the decisions taken along the way.

## Stack
Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui-style components (hand-written in src/components/ui), Supabase (Postgres, Auth, Storage), Drizzle ORM, Anthropic API, Resend, Vercel. Tests: Vitest and Playwright.

## Rules
- Every task must reference a metric. Never allow a task without one.
- Overdue is computed (due_date < today and status != completed), never stored.
- Every table has workspace_id and row-level security. Never query across workspaces.
- Import and Pulse must only use facts from the source document or the programme data. Return null for anything not found; never invent targets, dates or owners.
- Nothing from an Import is saved until the user confirms on the review screen.
- Use British English in UI copy. Spell it programme, not program.
- Avoid the words leverage, unlock, revolutionize, future-ready and seamless anywhere in the product.

## Data access (important)
- Read and write workspace data only through `asUser(userId, tx => …)` from `src/db`. It sets the JWT claim and switches to the `authenticated` role so RLS applies, both locally and on Supabase.
- `adminDb()` bypasses RLS. Use it only for auth bootstrap (users row, local credentials, invite lookup by token).
- Policies, helper functions (`app.*`) and integrity triggers live in `drizzle/0001_rls.sql`. New tables need `ENABLE ROW LEVEL SECURITY` and policies in a new custom migration (`npx drizzle-kit generate --custom --name <name>`).

## Design
Palette: Kente Gold #E8A317 (primary), Forest Green #1F5E3B (completed, on track), Terracotta #C1440E (overdue, alerts), Ink #1A1A1A (text, sidebar), Warm Cream #FAF6EE (background). Fonts: Bricolage Grotesque for headings, DM Sans for body. Status colours do real work: green for done, gold for in progress or at risk, terracotta for overdue or behind. Keep the look clean and professional; the kente reference is a thin woven strip in the sidebar and the logo mark, not patterns everywhere.

## Local development
- Postgres runs locally (`service postgresql start`). `scripts/reset-db.sh [db]` recreates a database and applies migrations. Unit/RLS tests use `kente_test`; Playwright uses `kente_e2e`.
- With no Supabase env vars, auth falls back to local email/password with a signed cookie (dev and tests only; refused in production unless `KENTE_ALLOW_LOCAL_AUTH=1`).
- With no `RESEND_API_KEY`, emails are logged to the server console.

## Workflow
- Work one slice at a time from the build order in docs/TECH-SPEC.md. Do not start the next slice until the current one has passing tests.
- Write a Playwright test for each user-facing flow you build.
- Run `npm run lint`, `npm run typecheck`, `npm run test` and `npm run test:e2e` before declaring a slice done.
- Keep database changes in Drizzle migrations; never edit the database by hand.
- Ask before adding a new dependency or changing the stack.
- Commit after each working step with a clear message.
