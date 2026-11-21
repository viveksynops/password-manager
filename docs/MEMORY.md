# Project Memory

This file is the current state of the project. Update it at the end of every work session and after every completed task. AI tools must read it at the start of every session and update it at the end.

**Last updated:** 2026-11-21

Related documents:
- `DECISIONS.md`: permanent decisions (rarely changes)
- `MEMORY.md`: current project state (changes often)

---

## Current Status

Planning phase is complete. Project documentation is written and ready. No application code has been written yet. Setup (Phase 1) has not started.

**Overall progress:** 1 of 138 tasks complete (1%)

---

## Project Summary

**Product:** Company Vault, an internal password and secrets manager for client projects.

**What it stores:** client details, project service logins (Supabase, Cloudinary, Vercel, etc.) and environment variables per project (dev, staging, production).

**Stack:** Next.js (App Router), TypeScript, Supabase, shadcn/ui, Tailwind CSS.

**Requested by:** Software company manager.

---

## Completed

- [x] Product requirements defined (`PRD.md`)
- [x] Architecture defined (`ARCHITECTURE.md`)
- [x] Design system defined (`DESIGN.md`)
- [x] Development rules defined (`RULES.md`)
- [x] Task breakdown created, 138 tasks in 15 phases (`TASKS.md`)
- [x] Architecture decisions recorded, 21 ADRs (`DECISIONS.md`)
- [x] **TASK-001**: Initialize Next.js project with TypeScript, App Router and `src/` directory
- [x] **TASK-002**: Enable TypeScript `strict` mode and configure ESLint and Prettier
- [x] **TASK-003**: Configure Tailwind CSS (Tailwind v4 with `@theme inline` and shadcn integration)
- [x] **TASK-004**: Initialize shadcn/ui and add base components (built on Base UI, zinc theme)
- [x] **TASK-006**: Create folder structure from `ARCHITECTURE.md`
- [x] **TASK-007**: Configure Git, `.gitignore`, and `.env.example`
- [x] **TASK-008**: Install core packages (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `server-only`)
- [x] **TASK-009**: Set up testing tools (Vitest, React Testing Library, jsdom)
- [x] **TASK-011**: Set up validated environment variables in `lib/env.ts`
- [x] **TASK-013**: Set up Supabase CLI and `supabase/migrations/` folder
- [x] **TASK-014**: Create `profiles` table (role, status) linked to Supabase Auth users, with RLS
- [x] **TASK-015**: Create `clients` table with RLS
- [x] **TASK-016**: Create `projects` table with RLS
- [x] **TASK-017**: Create `project_members` table with RLS
- [x] **TASK-018**: Create `credentials` table with RLS
- [x] **TASK-019**: Create `env_variables` table with RLS
- [x] **TASK-020**: Create append-only `audit_logs` table with RLS and immutable trigger
- [x] **TASK-021**: Create helper SQL functions for role and project-access checks used by policies
- [x] **TASK-022**: Generate TypeScript types into `src/types/database.types.ts`
- [x] **TASK-023**: Write RLS tests (Developer cannot read unassigned projects)
- [x] **TASK-024**: Create seed data with fake, non-real values in `supabase/seed.sql`

---

## Current Task

**TASK-025:** Generate `MASTER_KEY` and store it in local `.env.local` and a secure backup 🔒 (Phase 3: Encryption and Core Libraries)

**Phase:** 3, Encryption and Core Libraries

**Status:** Ready to start

---

## In Progress

Phase 2 complete (12/12 tasks). Ready for Phase 3.

---

## Phase Progress

| Phase | Status | Tasks done |
|---|---|---|
| 1. Setup | Mostly complete (awaiting Supabase keys) | 9 / 12 |
| 2. Database and Security Foundation | Complete | 12 / 12 |
| 3. Encryption and Core Libraries | Not started | 0 / 7 |
| 4. Authentication | Not started | 0 / 10 |
| 5. App Layout | Not started | 0 / 7 |
| 6. Team Management | Not started | 0 / 6 |
| 7. Clients | Not started | 0 / 9 |
| 8. Projects | Not started | 0 / 11 |
| 9. Credentials Vault | Not started | 0 / 15 |
| 10. Environment Variables | Not started | 0 / 13 |
| 11. Audit Logs | Not started | 0 / 6 |
| 12. Search and Productivity | Not started | 0 / 5 |
| 13. Hardening and Quality | Not started | 0 / 9 |
| 14. Deployment | Not started | 0 / 8 |
| 15. Browser Extension (later) | Not started | 0 / 8 |

---

## Environment Status

| Item | Status |
|---|---|
| Git repository | Initialized |
| Next.js project | Initialized with `src/`, App Router & TypeScript |
| Supabase project (separate for vault) | Not created |
| Database migrations | None |
| `MASTER_KEY` generated and backed up | No |
| Hosting (Vercel) | Not configured |
| SMTP for invites | Not configured |

---

## Open Questions

- Which hosting plan and region will be used? (affects data location and VPN or IP allowlist options)
- Which email provider will send team invites?
- Who is the first Admin user?
- Who will review security-critical (🔒) tasks?
- Should the Supabase plan include Point-in-Time Recovery from the start?
- Where will the offline backup of `MASTER_KEY` be stored, and who holds it?

---

## Known Issues

None yet. Add issues here as they are found, in this format:

```
- [ ] Short description (found in TASK-XXX, severity: low | medium | high)
```

---

## Technical Debt and Notes

None yet.

---

## Blockers

None.

---

## Next Step

Start **TASK-002**: Enable TypeScript `strict` mode and configure ESLint and Prettier.

---

## Session Log

| Date | Work done | Next |
|---|---|---|
| 2026-11-21 | Wrote PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS and MEMORY | Start TASK-001 |
| 2026-11-21 | Completed TASK-001 (Migrated Next.js project structure into `src/`, updated paths, verified build and lint) | Start TASK-002 |

---

## How to Update This File

At the end of every session or task:

1. Move the finished task into **Completed** (with its TASK number).
2. Set **Current Task** to the next task and its status.
3. Update the **Phase Progress** counts and **Overall progress**.
4. Add or resolve items in **Known Issues**, **Blockers** and **Open Questions**.
5. Update **Environment Status** if anything was created or configured.
6. Add one line to the **Session Log**.
7. Update **Next Step**.

### Rules
- Keep this file short and factual. It describes the present, not the past or the future.
- Never store secrets, passwords, keys or real client data in this file.
- Do not record permanent decisions here. Add them to `DECISIONS.md` instead.
- If this file and the code disagree, check the code and fix this file.

---

## Distinction

| File | Purpose | Changes |
|---|---|---|
| `DECISIONS.md` | Permanent decisions and why | Rarely |
| `MEMORY.md` | Current project state | Every session |

---

**Remember: MEMORY.md = WHERE THE PROJECT IS RIGHT NOW.**
