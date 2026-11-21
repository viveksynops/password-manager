# Tasks

Never ask AI to build the entire application in one prompt. Work through one task at a time, in order.

Project documents to read before every task:
- `PRD.md`: what and why
- `ARCHITECTURE.md`: how it works
- `DESIGN.md`: how it looks
- `RULES.md`: how to behave

---

## Workflow

```
TASK-001
   ↓
Read docs + inspect existing code
   ↓
Implement
   ↓
Test
   ↓
Review (RULES.md Definition of Done)
   ↓
Commit + mark complete [x]
   ↓
TASK-002
```

### Rules for working through tasks
- Do one task at a time. Do not start the next until the current one is complete.
- Each task should be small enough to finish in one focused session and one commit.
- If a task feels too big, split it into sub-tasks before starting.
- Do not skip tasks marked 🔒 (security-critical). They need a teammate review.
- Tasks that depend on others list them under `Depends on`.

### Prompt template for AI

```
Read PRD.md, ARCHITECTURE.md, DESIGN.md and RULES.md.
Work only on TASK-XXX: <task title>.
Inspect existing code first and reuse what exists.
Do not modify unrelated files.
When done, list files changed and how to test it.
```

---

## Phase 1: Setup

- [x] **TASK-001** Initialize Next.js project with TypeScript, App Router and `src/` directory
- [x] **TASK-002** Enable TypeScript `strict` mode and configure ESLint and Prettier
- [x] **TASK-003** Configure Tailwind CSS
- [x] **TASK-004** Initialize shadcn/ui and add base components (button, input, card, table, dialog, dropdown-menu, tabs, badge, sonner, sidebar, form, select, textarea, skeleton, alert-dialog)
- [-] **TASK-005** Apply `DESIGN.md` theme (Inter and JetBrains Mono fonts, color variables, radius, dark mode) *(Skipped per user request: keep installed shadcn base-vega zinc theme)*
- [x] **TASK-006** Create folder structure from `ARCHITECTURE.md`
- [x] **TASK-007** Configure Git, `.gitignore`, `.env.example` and branch rules
- [x] **TASK-008** Install core packages (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `lucide-react`)
- [x] **TASK-009** Set up testing tools (Vitest, React Testing Library)
- [ ] **TASK-010** Create a new, separate Supabase project for the vault *(Pending: user creating Supabase account and providing keys)*
- [x] **TASK-011** Set up validated environment variables in `lib/env.ts`
- [ ] **TASK-012** Disable public signup in Supabase Auth settings *(Pending Supabase project)*

---

## Phase 2: Database and Security Foundation

- [ ] **TASK-013** Set up Supabase CLI and the `supabase/migrations/` folder
- [ ] **TASK-014** Create `profiles` table (role, status) linked to Supabase Auth users, with RLS
- [ ] **TASK-015** Create `clients` table with RLS
- [ ] **TASK-016** Create `projects` table with RLS
- [ ] **TASK-017** Create `project_members` table with RLS
- [ ] **TASK-018** Create `credentials` table with RLS 🔒
- [ ] **TASK-019** Create `env_variables` table with RLS 🔒
- [ ] **TASK-020** Create append-only `audit_logs` table with RLS 🔒
- [ ] **TASK-021** Create helper SQL functions for role and project-access checks used by policies
- [ ] **TASK-022** Generate TypeScript types into `types/database.types.ts`
- [ ] **TASK-023** Write RLS tests (Developer cannot read unassigned projects) 🔒
- [ ] **TASK-024** Create seed data with fake, clearly non-real values

---

## Phase 3: Encryption and Core Libraries

- [ ] **TASK-025** Generate `MASTER_KEY` and store it in local `.env.local` and a secure backup 🔒
- [ ] **TASK-026** Create `lib/crypto.ts` with AES-256-GCM `encrypt` and `decrypt` (`server-only`) 🔒
- [ ] **TASK-027** Add crypto tests (round trip, unique IVs, tamper detection, wrong key fails) 🔒
- [ ] **TASK-028** Create Supabase clients in `lib/supabase/` (browser, server, middleware)
- [ ] **TASK-029** Create `lib/auth.ts` with `getCurrentUser()` and `requireRole()` 🔒
- [ ] **TASK-030** Create `audit.service.ts` with a `logAction()` function 🔒
- [ ] **TASK-031** Create shared action result type and safe error helper

---

## Phase 4: Authentication

- [ ] **TASK-032** Create login page (email and password)
- [ ] **TASK-033** Configure Supabase Auth session handling with `@supabase/ssr`
- [ ] **TASK-034** Create `middleware.ts` to protect dashboard routes
- [ ] **TASK-035** Create MFA enrollment page (QR code and verify code) 🔒
- [ ] **TASK-036** Create MFA verification step on login 🔒
- [ ] **TASK-037** Require MFA before accessing any dashboard page 🔒
- [ ] **TASK-038** Add logout and session timeout handling
- [ ] **TASK-039** Create forgot and reset password flow
- [ ] **TASK-040** Create accept-invite page for new team members
- [ ] **TASK-041** Test authentication flows end to end

---

## Phase 5: App Layout

- [ ] **TASK-042** Create dashboard layout with sidebar and header
- [ ] **TASK-043** Make sidebar responsive (sheet on mobile)
- [ ] **TASK-044** Show sidebar items by role (hide Admin-only items)
- [ ] **TASK-045** Add breadcrumb component
- [ ] **TASK-046** Add dark mode toggle
- [ ] **TASK-047** Create reusable `DataTable`, `EmptyState`, `ErrorState` and `ConfirmDialog` components
- [ ] **TASK-048** Create dashboard home page (counts of clients and projects, recent activity)

---

## Phase 6: Team Management (Admin)

- [ ] **TASK-049** Create `user.service.ts` (list users, update role, deactivate)
- [ ] **TASK-050** Create team list page (Admin only)
- [ ] **TASK-051** Create invite user form and action (uses service role, server only) 🔒
- [ ] **TASK-052** Add change role and deactivate user actions 🔒
- [ ] **TASK-053** Ensure deactivated users lose access immediately 🔒
- [ ] **TASK-054** Add tests for team management and role checks

---

## Phase 7: Clients

- [ ] **TASK-055** Create Zod schemas for clients
- [ ] **TASK-056** Create `client.service.ts`
- [ ] **TASK-057** Create client server actions with role checks
- [ ] **TASK-058** Create clients list page with search and pagination
- [ ] **TASK-059** Create add and edit client form
- [ ] **TASK-060** Add archive client functionality
- [ ] **TASK-061** Create client detail page showing its projects
- [ ] **TASK-062** Add loading, empty and error states
- [ ] **TASK-063** Add tests for clients

---

## Phase 8: Projects

- [ ] **TASK-064** Create Zod schemas for projects
- [ ] **TASK-065** Create `project.service.ts`
- [ ] **TASK-066** Create project server actions with role checks
- [ ] **TASK-067** Create projects list page (filtered by user access)
- [ ] **TASK-068** Create add and edit project form
- [ ] **TASK-069** Add archive project functionality
- [ ] **TASK-070** Create project detail page with tabs (Credentials, Env Variables)
- [ ] **TASK-071** Add assign and remove team members on a project
- [ ] **TASK-072** Confirm Developers see only assigned projects 🔒
- [ ] **TASK-073** Add loading, empty and error states
- [ ] **TASK-074** Add tests for projects and access rules

---

## Phase 9: Credentials Vault

- [ ] **TASK-075** Create Zod schemas for credentials
- [ ] **TASK-076** Create `credential.service.ts` that encrypts on save 🔒
- [ ] **TASK-077** Create `SecretField` component (hidden, loading, revealed, copied states) 🔒
- [ ] **TASK-078** Create credentials list on the project page (passwords not included in the list data) 🔒
- [ ] **TASK-079** Create add credential form (service, login URL, username, password, notes)
- [ ] **TASK-080** Create edit credential form (password can be left unchanged)
- [ ] **TASK-081** Create delete credential with confirmation
- [ ] **TASK-082** Create `revealCredential` server action: check access, decrypt, write audit log 🔒
- [ ] **TASK-083** Add copy with automatic clipboard clear after 30 seconds
- [ ] **TASK-084** Add auto-hide of revealed values after 15 seconds
- [ ] **TASK-085** Add "Open site" button for the login URL
- [ ] **TASK-086** Add password generator
- [ ] **TASK-087** Add audit logging for create, update and delete of credentials 🔒
- [ ] **TASK-088** Add loading, empty and error states
- [ ] **TASK-089** Add tests for credentials (encryption stored, access rules, audit entries) 🔒

---

## Phase 10: Environment Variables

- [ ] **TASK-090** Create Zod schemas for env variables
- [ ] **TASK-091** Create `env-parser.ts` utility to parse and export `.env` text
- [ ] **TASK-092** Add tests for the env parser (comments, quotes, empty values, duplicates)
- [ ] **TASK-093** Create `env.service.ts` that encrypts on save 🔒
- [ ] **TASK-094** Create environment switcher (Dev, Staging, Prod) with environment badges
- [ ] **TASK-095** Create env variables table using `SecretField`
- [ ] **TASK-096** Create add and edit variable form
- [ ] **TASK-097** Create delete variable with confirmation (typed confirmation for Production)
- [ ] **TASK-098** Create "Paste .env" bulk import dialog with preview
- [ ] **TASK-099** Create "Export .env" action with audit log 🔒
- [ ] **TASK-100** Add reveal and copy actions with audit logging 🔒
- [ ] **TASK-101** Add loading, empty and error states
- [ ] **TASK-102** Add tests for env variables 🔒

---

## Phase 11: Audit Logs

- [ ] **TASK-103** Make sure all sensitive actions write audit logs (review every action)
- [ ] **TASK-104** Create audit logs page (Admin only)
- [ ] **TASK-105** Add filters (user, action, project, date range) and pagination
- [ ] **TASK-106** Show relative time with full timestamp on hover
- [ ] **TASK-107** Confirm audit logs cannot be edited or deleted by any role 🔒
- [ ] **TASK-108** Add tests for audit logs

---

## Phase 12: Search and Productivity

- [ ] **TASK-109** Create global search across clients, projects and services
- [ ] **TASK-110** Add search shortcut (Cmd/Ctrl + K) with results by user access
- [ ] **TASK-111** Add tags and favorites
- [ ] **TASK-112** Add custom fields for credentials (API key, license key, database URL)
- [ ] **TASK-113** Add tests for search (users only see results they have access to) 🔒

---

## Phase 13: Hardening and Quality

- [ ] **TASK-114** Add rate limiting on login and reveal actions 🔒
- [ ] **TASK-115** Add security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- [ ] **TASK-116** Search the codebase to confirm no secrets are logged or returned in errors 🔒
- [ ] **TASK-117** Check that no secret appears in page HTML, props or URLs 🔒
- [ ] **TASK-118** Run accessibility check (keyboard navigation, contrast, screen reader labels)
- [ ] **TASK-119** Check responsive layout at 360px, tablet and desktop
- [ ] **TASK-120** Review every RLS policy once more 🔒
- [ ] **TASK-121** Run `npm audit` and fix issues
- [ ] **TASK-122** Full end-to-end test of all success criteria in `PRD.md`

---

## Phase 14: Deployment

- [ ] **TASK-123** Set environment variables on the host (Vercel) 🔒
- [ ] **TASK-124** Configure production Supabase (auth URLs, SMTP for invites, MFA enabled)
- [ ] **TASK-125** Enable Supabase backups and Point-in-Time Recovery
- [ ] **TASK-126** Store a secure offline backup of `MASTER_KEY` in a separate location 🔒
- [ ] **TASK-127** Restrict access (VPN or IP allowlist) if possible
- [ ] **TASK-128** Deploy to production and run a smoke test
- [ ] **TASK-129** Create the first Admin user and invite the team
- [ ] **TASK-130** Write short user guide and offboarding steps for the team

---

## Phase 15: Browser Extension (Later, Phase 2 of the Product)

Do not start until the web app is stable and in daily use.

- [ ] **TASK-131** Create separate extension project (Vite, React, Tailwind, Manifest V3)
- [ ] **TASK-132** Create extension login with MFA using Supabase
- [ ] **TASK-133** Create secure API route for extension credential lookup 🔒
- [ ] **TASK-134** Match credentials by exact domain, never by "contains" 🔒
- [ ] **TASK-135** Create content script that detects login fields
- [ ] **TASK-136** Fill credentials only on user click, never automatically 🔒
- [ ] **TASK-137** Add auto-lock after inactivity and audit logging of every fill 🔒
- [ ] **TASK-138** Test with real sites and package privately for the team

---

## Task Template

Copy this when adding new tasks:

```
### TASK-XXX: Title
- **Goal:** what this task achieves
- **Depends on:** TASK-XXX
- **Files likely touched:** list
- **Acceptance criteria:**
  - [ ] ...
  - [ ] ...
- **Tests:** what to test
- **Security-critical:** yes / no
```

---

## Progress Tracker

| Phase | Status |
|---|---|
| 1. Setup | Not started |
| 2. Database and Security Foundation | Not started |
| 3. Encryption and Core Libraries | Not started |
| 4. Authentication | Not started |
| 5. App Layout | Not started |
| 6. Team Management | Not started |
| 7. Clients | Not started |
| 8. Projects | Not started |
| 9. Credentials Vault | Not started |
| 10. Environment Variables | Not started |
| 11. Audit Logs | Not started |
| 12. Search and Productivity | Not started |
| 13. Hardening and Quality | Not started |
| 14. Deployment | Not started |
| 15. Browser Extension | Not started |

**MVP is complete after Phase 14.** Phase 15 is the later extension.

🔒 = security-critical. Requires teammate review before merging.

---

**Remember: one task at a time.** Implement, test, review, mark complete, then move on.
