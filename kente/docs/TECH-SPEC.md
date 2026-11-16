# Kente — Technical Spec and Claude Code Brief

Companion to the Kente PRD. Version 0.1, November 2026. Stack choices here are a recommendation; swap any of them before the first session.

## 1. Stack

| Layer             | Choice                                      | Why                                                                                                    |
|-------------------|---------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Framework         | Next.js 15 (App Router) with TypeScript     | One codebase for UI and API; easy for Claude Code to work in                                           |
| UI                | Tailwind CSS and shadcn/ui                  | Fast, consistent components; Kente palette set as Tailwind tokens                                      |
| Database and auth | Supabase (Postgres, Auth, Storage)          | Hosted Postgres, email and Google login, file storage for the Vault, row-level security for workspaces |
| ORM               | Drizzle                                     | Typed schema and migrations that Claude Code can read and edit                                         |
| AI                | Anthropic API (Claude)                      | Powers Import, Kente Pulse and report drafting                                                         |
| Email             | Resend                                      | Overdue alerts, digests and invites                                                                    |
| Jobs              | Vercel Cron or Supabase scheduled functions | Nightly overdue check and digest sends                                                                 |
| Payments          | Paystack first, Stripe for international    | Naira and card payments in Nigeria; Stripe for USD customers                                           |
| Hosting           | Vercel                                      | Zero-config deploys from GitHub                                                                        |
| Testing           | Vitest and Playwright                       | Unit tests for logic, end-to-end tests for the key flows                                               |

## 2. Data model

Every table carries workspace_id and is protected by row-level security so one customer can never read another's data.

| Table         | Key fields                                                                                                                                       | Notes                                                         |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| workspaces    | name, plan, created_at                                                                                                                           | One per paying customer                                       |
| users         | email, name                                                                                                                                      | Supabase Auth user                                            |
| memberships   | workspace_id, user_id, role                                                                                                                      | Roles: owner, lead, member, reviewer, viewer                  |
| programmes    | workspace_id, name, description, start_date, end_date                                                                                            | Top level container                                           |
| stakeholders  | programme_id, user_id or email, role_title, team                                                                                                 | A person on a programme; may be invited and not yet signed up |
| teams         | programme_id, name                                                                                                                               | Grouping for stakeholders                                     |
| metrics       | programme_id, title, description, target, baseline, current, unit, deadline, status                                                              | Status: on_track, at_risk, behind, achieved                   |
| tasks         | programme_id, metric_id (required), title, description, assignee_stakeholder_id or team_id, start_date, due_date, priority, status, completed_at | Status: pending, in_progress, completed; overdue is computed  |
| task_comments | task_id, author_id, body                                                                                                                         | Progress updates                                              |
| reports       | task_id, author_id, summary, challenges, feedback, lessons, status                                                                               | Status: draft, submitted, approved                            |
| files         | programme_id, name, storage_path, folder, tags, size, uploaded_by                                                                                | Vault records; file bytes live in Supabase Storage            |
| file_links    | file_id, task_id or metric_id or report_id                                                                                                       | Attach files to work                                          |
| imports       | programme_id, file_id, status, extracted_json, confirmed_at                                                                                      | One row per Import run                                        |
| notifications | user_id, type, payload, sent_at, read_at                                                                                                         | Alerts and digests                                            |

## 3. Permissions

| Role     | Programmes       | Metrics and tasks    | Reports          | Vault            | Settings            |
|----------|------------------|----------------------|------------------|------------------|---------------------|
| Owner    | All              | All                  | Approve          | All              | Billing, members    |
| Lead     | Create, edit own | Create, edit, assign | Approve          | Upload, organise | Invite stakeholders |
| Member   | View assigned    | Update own tasks     | Write own        | Upload           | None                |
| Reviewer | View assigned    | Comment              | Approve assigned | View             | None                |
| Viewer   | View shared      | View                 | View approved    | View shared      | None                |

## 4. AI features

### Import

1.  User uploads PDF, Word or Excel. Text is extracted server-side (pdf-parse, mammoth, SheetJS).

2.  Claude receives the text with a structured-output prompt and returns JSON: metrics (title, target, unit, deadline, source excerpt) and tasks (title, metric reference, owner, start, due, source excerpt).

3.  Rule: values come only from the document. A field the document does not give is returned as null and shown blank on the review screen.

4.  Review screen lets the manager edit, merge, re-link or discard each item. Nothing is written to metrics or tasks until Create programme is pressed.

5.  The source file is stored in the Vault and linked to everything created.

### Kente Pulse

Nightly job and on-demand button. Input: the programme's tasks, metrics and recent reports as JSON. Output: Done, Pending, Next steps and At-risk metrics, in plain English, no more than 150 words. Cached per programme per day.

### Report assist

Drafts the four report fields from the task's description, comments and status history. The lead edits before submitting.

## 5. Build order

| Slice | Scope                                                                                                         | Done when                                                       |
|-------|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| 0     | Repo, Next.js, Supabase, auth, workspace and programme creation, Kente theme                                  | A user can sign up, create a workspace and a programme          |
| 1     | Stakeholders and teams, invites by email                                                                      | A lead can invite a member who can log in and see the programme |
| 2     | Metric and Log: metrics CRUD, tasks CRUD with required metric, list, board and timeline views, status updates | Tasks roll up into metric progress                              |
| 3     | Dashboard: stat cards, period toggle, metric bars, accountability table                                       | Matches the prototype                                           |
| 4     | Overdue alerts and weekly digest emails                                                                       | Emails arrive on a test workspace                               |
| 5     | Vault: upload, folders, tags, search, links to tasks and metrics                                              | Files are searchable and attachable                             |
| 6     | Reporting: task reports, review and approval, funder report export to Word and PDF                            | A funder report downloads                                       |
| 7     | Import: upload, extraction, review screen, confirm                                                            | A sample proposal becomes metrics and tasks                     |
| 8     | Kente Pulse and report assist                                                                                 | Pulse appears on the Dashboard                                  |
| 9     | Billing with Paystack and Stripe, plan limits                                                                 | A workspace can upgrade                                         |
| 10    | Security review, Playwright tests for every slice, pilot onboarding                                           | Two pilot programmes running live                               |

Each slice is one or more Claude Code sessions. Finish and test a slice before starting the next.

## 6. Accounts to set up before the first session

- GitHub repository (private)

- Supabase project

- Vercel project linked to the repo

- Anthropic API key

- Resend account and a sending domain

- Paystack account; Stripe later

- A domain for the app

## 7. CLAUDE.md

Save this as CLAUDE.md in the root of the repository. Claude Code reads it at the start of every session.

\# Kente  
  
Kente is a programme and project management web app for organisations that deliver programmes: NGOs, development agencies, corporates, accelerators and venture studios. Its core idea: every task is tied to a programme outcome (a Metric), so daily work always rolls up to results.  
  
\## Modules  
Dashboard, Stakeholders, Vault, Log, Metric, Reporting, Import. Kente Pulse is the AI weekly brief on the Dashboard. See docs/PRD.md for full requirements and docs/TECH-SPEC.md for the data model and build order.  
  
\## Stack  
Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage), Drizzle ORM, Anthropic API, Resend, Vercel. Tests: Vitest and Playwright.  
  
\## Rules  
- Every task must reference a metric. Never allow a task without one.  
- Overdue is computed (due_date \< today and status != completed), never stored.  
- Every table has workspace_id and row-level security. Never query across workspaces.  
- Import and Pulse must only use facts from the source document or the programme data. Return null for anything not found; never invent targets, dates or owners.  
- Nothing from an Import is saved until the user confirms on the review screen.  
- Use British English in UI copy. Spell it programme, not program.  
- Avoid the words leverage, unlock, revolutionize, future-ready and seamless anywhere in the product.  
  
\## Design  
Palette: Kente Gold \#E8A317 (primary), Forest Green \#1F5E3B (completed, on track), Terracotta \#C1440E (overdue, alerts), Ink \#1A1A1A (text, sidebar), Warm Cream \#FAF6EE (background). Fonts: Bricolage Grotesque for headings, DM Sans for body. Status colours do real work: green for done, gold for in progress or at risk, terracotta for overdue or behind. Keep the look clean and professional; the kente reference is a thin woven strip in the sidebar and the logo mark, not patterns everywhere.  
  
\## Workflow  
- Work one slice at a time from the build order in docs/TECH-SPEC.md. Do not start the next slice until the current one has passing tests.  
- Write a Playwright test for each user-facing flow you build.  
- Run \`npm run lint\` and \`npm run test\` before declaring a slice done.  
- Keep database changes in Drizzle migrations; never edit the database by hand.  
- Ask before adding a new dependency or changing the stack.  
- Commit after each working step with a clear message.

## 8. First session prompt

After creating the repo and adding CLAUDE.md, docs/PRD.md and docs/TECH-SPEC.md, open Claude Code in the repo folder and start with:

"Read CLAUDE.md, docs/PRD.md and docs/TECH-SPEC.md. Then build slice 0 from the build order: set up the Next.js project, Supabase auth, the Drizzle schema for workspaces, users, memberships and programmes, and the Kente theme. Stop and show me the plan before writing code."
