# Kente — Product Requirements Document

Working name: Kente, pending trademark check. Owner: Freda, EBH Africa. Version 0.1, November 2026.

## 1. Product overview

An automated programme and project management web platform for organisations that deliver programmes. It combines the task tracking of Trello and the knowledge organisation of Notion, and adds what neither does natively: every task is tied to a programme outcome, so managers can see in real time how daily work moves the KPIs that funders, boards and leadership care about.

The platform has six core modules: Dashboard, Stakeholders, Vault, Log, Metric and Reporting, supported by an automation layer of overdue alerts, email summaries and AI-generated programme briefs.

## 2. Problem

Programme teams typically run delivery across spreadsheets, WhatsApp groups, email threads and shared drives. The consequences are consistent:

- Tasks fall through the cracks because ownership and due dates live in different places.

- Programme managers cannot see at a glance who is behind or what is overdue.

- Documents are scattered, so finding the latest proposal or report wastes time.

- Activities are not linked to outcomes, so reporting to funders or leadership becomes a manual, end-of-quarter scramble.

- Implementation lessons, challenges and feedback are lost because there is no structured place to capture them.

## 3. Target customers

- NGOs delivering funded programmes

- Development agencies and their implementing partners

- Corporates running CSR, training or internal programmes

- Accelerators and incubators managing cohorts

- Venture studios running multiple build projects

- Individual programme managers who want a structured internal tool

Primary buyer: Head of Programmes, Programme Director or Operations Lead. Primary daily users: programme managers, officers, coordinators and implementing team members.

## 4. Goals and success measures

- Replace spreadsheets as the system of record for programme delivery.

- Give programme leads a complete status picture in under one minute.

- Reduce overdue tasks through automated alerts and visible accountability.

- Cut time spent preparing funder and leadership reports.

Suggested launch metrics: weekly active users per workspace, percentage of tasks linked to a metric, overdue task rate over time, number of reports generated, and paid conversion from free trial.

## 5. Core modules

### 5.1 Dashboard

A snapshot of all activity within a selected programme.

Requirements:

- Counts of tasks completed, pending and overdue.

- List of who is assigned to what, and who has incomplete or overdue tasks.

- Activity summary for a chosen period: day, week or month, set by user preference.

- Progress against programme metrics (from the Metric module).

- Filters by programme, project, team and stakeholder.

- AI brief panel showing key activities done, tasks pending and recommended next steps.

### 5.2 Stakeholders

The register of everyone involved in a programme or project.

Requirements:

- Onboard personnel by email invite with a defined role, for example Programme Lead, Officer, Facilitator, Partner, Reviewer.

- Group stakeholders into teams.

- Assign tasks to individuals or teams.

- Profile view showing each stakeholder's assigned tasks, status and completion rate.

- Role-based permissions controlling who can create, edit, assign, review and view.

### 5.3 Vault

A single, searchable home for programme records.

Requirements:

- Upload and store proposals, reports, spreadsheets, presentations and other files.

- Organise by programme, project and folder, with tags such as Proposal, Report, Budget, M&E.

- Full-text search across file names, tags and, where possible, document contents.

- Link files to tasks, metrics and reports.

- Version history and access permissions per folder.

### 5.4 Log

The daily register of tasks and activities.

Requirements:

- Create tasks with title, description, start date, due date, priority and status: Pending, In Progress, Completed, Overdue.

- Assign each task to a stakeholder or to a general team for review.

- Every task must be attached to a metric.

- Overdue status applied automatically once the due date passes without completion.

- Views: list, Kanban board and timeline.

- Assignees see timelines, due dates and status, and can update progress and add comments.

### 5.5 Metric

The programme work plan expressed as KPIs and key outcomes. This is the goal-setting layer every task rolls up to.

Requirements:

- Define outcomes per programme with a title, description, target value, unit, baseline and deadline, for example "Train 500 young founders by June 2027".

- Each Log task links to one metric; completed tasks show as contributions to that outcome.

- Progress shown as percentage achieved, tasks completed versus planned, and status: On Track, At Risk, Behind, Achieved.

- Metric view lists every linked activity, so managers can see exactly what work has moved each outcome.

- Optional manual progress entry for outcomes measured outside the platform, such as survey results.

### 5.6 Reporting

Structured implementation reports attached to each task.

Requirements:

- Every task has a report section completed by its lead.

- Report fields: summary of what was done, challenges, feedback received, lessons learned, supporting files from the Vault.

- Reviewers can comment on and approve reports.

- Reports roll up by metric and by programme, giving a full implementation record.

- Funder report generator: one click compiles metric progress, completed activities and task reports into a donor-ready document, exportable to Word or PDF.

### 5.7 Import

Upload a proposal, work plan or Gantt chart and have Kente itemise it into metrics and tasks, so a programme is set up in minutes rather than retyped.

Requirements:

- Accepts PDF, Word, Excel and Gantt chart files, including Gantt charts exported as spreadsheets or PDFs.

- AI reads the document and extracts outcomes as metrics and activities as tasks, with owners, start and due dates where the document gives them.

- Suggests targets and deadlines for each metric, drawn only from figures and timelines already in the document; nothing is invented, and anything not found is left blank for the manager.

- Review screen before saving: the manager can edit, merge, re-link or discard each suggested metric and task, and nothing enters the Log or Metric modules until confirmed.

- The source file is saved to the Vault and linked to the metrics and tasks created from it.

- Shows which part of the document each suggestion came from, so managers can check it.

## 6. Automation layer

- Overdue alerts: automatic email and in-app notifications to the assignee when a task is due soon and once it becomes overdue, with escalation to the programme lead after a set period.

- Email summaries: scheduled digest to the programme or project lead (daily, weekly or monthly) covering completed, pending and overdue tasks and metric progress.

- AI programme brief: generated summary of key activities completed, tasks pending, recommended next steps, and metrics not yet achieved or at risk. Available on the Dashboard and in email digests.

- AI report assist: drafts a task report from task updates and comments for the lead to edit.

## 7. Users and permissions

| Role             | Can do                                                                      |
|------------------|-----------------------------------------------------------------------------|
| Workspace Owner  | Billing, all programmes, all settings                                       |
| Programme Lead   | Create programmes, metrics and tasks; onboard stakeholders; approve reports |
| Team Member      | Update assigned tasks, submit reports, upload to Vault                      |
| Reviewer         | View and comment, approve assigned reviews                                  |
| Viewer or Funder | Read-only access to dashboards and shared reports                           |

## 8. Monetisation

Subscription pricing per workspace, tiered by programmes and users. Proposed structure, prices to be validated:

- Free: one programme, up to five users, limited Vault storage.

- Pro: unlimited programmes for small teams, alerts and email digests.

- Organisation: AI briefs, funder report generator, advanced permissions, more storage.

- Enterprise: multi-programme portfolio view, SSO, custom onboarding and support.

Open question: local currency pricing for African markets alongside USD pricing for international agencies.

## 9. Prototype: screen by screen

Layout across the app: a left sidebar with the programme switcher at the top, then Dashboard, Log, Metric, Stakeholders, Vault and Reporting. A top bar holds global search, notifications and the user menu.

### Dashboard

- Top row: four stat cards for Total Tasks, Completed, Pending and Overdue, with Overdue in red.

- Period toggle: Today, This Week, This Month.

- Left: Metric progress bars, one per outcome, coloured by status.

- Right: AI Programme Brief card with three short blocks: Done, Pending, Next Steps, plus a Regenerate button.

- Bottom: Team accountability table showing each stakeholder, tasks assigned, completed and overdue, sorted by overdue first.

### Log

- Toggle between List, Board and Timeline views.

- Board columns: Pending, In Progress, Completed, Overdue.

- Task card: title, assignee avatar, due date, linked metric tag, priority flag.

- New Task drawer: title, description, assignee or team, start and due dates, priority and a required Metric selector.

### Metric

- Grid of outcome cards: title, target, current value, progress ring and status badge.

- Clicking a card opens the outcome page: progress chart over time and the list of linked tasks and reports.

### Stakeholders

- Directory table: name, role, team, tasks assigned, completion rate.

- Invite button opens a form for email, role and team.

- Teams tab showing each team with its members.

### Vault

- Folder tree on the left, file grid or list on the right.

- Search bar with filters for type, tag, programme and date.

- File preview with a panel showing linked tasks and metrics.

### Reporting

- Task report form: summary, challenges, feedback, lessons, attachments.

- Reports list filterable by metric, lead and status: Draft, Submitted, Approved.

- Generate Funder Report button: choose programme, date range and metrics, preview, then export to Word or PDF.

## 10. MVP scope and next steps

MVP: Dashboard, Stakeholders, Log, Metric, basic Vault, task reports, overdue alerts and Import (upload a proposal or Gantt chart and itemise it into metrics and tasks). Phase two: AI briefs, email digests, funder report generator, advanced permissions. Phase three: portfolio view across programmes, integrations with Google Drive, Slack and WhatsApp, and a mobile app.

Open questions: product name, pricing in local currencies, and which customer segment to pilot with first.
