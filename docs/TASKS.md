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

- [x] **TASK-001** Initialize Next.js project with TypeScript, App Router and `apps/web/src/` directory
- [x] **TASK-002** Enable TypeScript `strict` mode and configure ESLint and Prettier
- [x] **TASK-003** Configure Tailwind CSS
- [x] **TASK-004** Initialize shadcn/ui and add base components (button, input, card, table, dialog, dropdown-menu, tabs, badge, sonner, sidebar, form, select, textarea, skeleton, alert-dialog)
- [-] **TASK-005** Apply `DESIGN.md` theme (Inter and JetBrains Mono fonts, color variables, radius, dark mode) *(Skipped per user request: keep installed shadcn base-vega zinc theme)*
- [x] **TASK-006** Create folder structure from `ARCHITECTURE.md`
- [x] **TASK-007** Configure Git, `.gitignore`, `.env.example` and branch rules
- [x] **TASK-008** Install core packages (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `lucide-react`)
- [x] **TASK-009** Set up testing tools (Vitest, React Testing Library)
- [x] **TASK-010** Create a new, separate Supabase project for the vault
- [x] **TASK-011** Set up validated environment variables in `lib/env.ts`
- [x] **TASK-012** Disable public signup in Supabase Auth settings (enforced invite-only)

---

## Phase 2: Database and Security Foundation

- [x] **TASK-013** Set up Supabase CLI and the `supabase/migrations/` folder
- [x] **TASK-014** Create `profiles` table (role, status) linked to Supabase Auth users, with RLS
- [x] **TASK-015** Create `clients` table with RLS
- [x] **TASK-016** Create `projects` table with RLS
- [x] **TASK-017** Create `project_members` table with RLS
- [x] **TASK-018** Create `credentials` table with RLS 🔒
- [x] **TASK-019** Create `env_variables` table with RLS 🔒
- [x] **TASK-020** Create append-only `audit_logs` table with RLS 🔒
- [x] **TASK-021** Create helper SQL functions for role and project-access checks used by policies
- [x] **TASK-022** Generate TypeScript types into `types/database.types.ts`
- [x] **TASK-023** Write RLS tests (Developer cannot read unassigned projects) 🔒
- [x] **TASK-024** Create seed data with fake, clearly non-real values

---

## Phase 3: Encryption and Core Libraries

- [x] **TASK-025** Generate `MASTER_KEY` and store it in local `.env.local` and a secure backup 🔒
- [x] **TASK-026** Create `lib/crypto.ts` with AES-256-GCM `encrypt` and `decrypt` (`server-only`) 🔒
- [x] **TASK-027** Add crypto tests (round trip, unique IVs, tamper detection, wrong key fails) 🔒
- [x] **TASK-028** Create Supabase clients in `lib/supabase/` (browser, server, middleware)
- [x] **TASK-029** Create `lib/auth.ts` with `getCurrentUser()` and `requireRole()` 🔒
- [x] **TASK-030** Create `audit.service.ts` with a `logAction()` function 🔒
- [x] **TASK-031** Create shared action result type and safe error helper

---

## Phase 4: Authentication

- [x] **TASK-032** Create login page (email and password)
- [x] **TASK-033** Configure Supabase Auth session handling with `@supabase/ssr`
- [x] **TASK-034** Create `middleware.ts` to protect dashboard routes
- [x] **TASK-035** Create MFA enrollment page (QR code and verify code) 🔒
- [x] **TASK-036** Create MFA verification step on login 🔒
- [x] **TASK-037** Require MFA before accessing any dashboard page 🔒
- [x] **TASK-038** Add logout and session timeout handling
- [x] **TASK-039** Create forgot and reset password flow
- [x] **TASK-040** Create accept-invite page for new team members
- [x] **TASK-041** Test authentication flows end to end

---

## Phase 5: App Layout

- [x] **TASK-042** Create dashboard layout with sidebar and header
- [x] **TASK-043** Make sidebar responsive (sheet on mobile)
- [x] **TASK-044** Show sidebar items by role (hide Admin-only items)
- [x] **TASK-045** Add breadcrumb component
- [x] **TASK-046** Add dark mode toggle
- [x] **TASK-047** Create reusable `DataTable`, `EmptyState`, `ErrorState` and `ConfirmDialog` components
- [x] **TASK-048** Create dashboard home page (counts of clients and projects, recent activity)

---

## Phase 6: Team Management (Admin)

- [x] **TASK-049** Create `user.service.ts` (list users, update role, deactivate)
- [x] **TASK-050** Create team list page (Admin only)
- [x] **TASK-051** Create invite user form and action (uses service role, server only) 🔒
- [x] **TASK-052** Add change role and deactivate user actions 🔒
- [x] **TASK-053** Ensure deactivated users lose access immediately 🔒
- [x] **TASK-054** Add tests for team management and role checks

---

## Phase 7: Clients

- [x] **TASK-055** Create Zod schemas for clients
- [x] **TASK-056** Create `client.service.ts`
- [x] **TASK-057** Create client server actions with role checks
- [x] **TASK-058** Create clients list page with search and pagination
- [x] **TASK-059** Create add and edit client form
- [x] **TASK-060** Add archive client functionality
- [x] **TASK-061** Create client detail page showing its projects
- [x] **TASK-062** Add loading, empty and error states
- [x] **TASK-063** Add tests for clients

---

## Phase 8: Projects

- [x] **TASK-064** Create Zod schemas for projects
- [x] **TASK-065** Create `project.service.ts`
- [x] **TASK-066** Create project server actions with role checks
- [x] **TASK-067** Create projects list page (filtered by user access)
- [x] **TASK-068** Create add and edit project form
- [x] **TASK-069** Add archive project functionality
- [x] **TASK-070** Create project detail page with tabs (Credentials, Env Variables)
- [x] **TASK-071** Add assign and remove team members on a project
- [x] **TASK-072** Confirm Developers see only assigned projects 🔒
- [x] **TASK-073** Add loading, empty and error states
- [x] **TASK-074** Add tests for projects and access rules

---

## Phase 9: Credentials Vault

- [x] **TASK-075** Create Zod schemas for credentials
- [x] **TASK-076** Create `credential.service.ts` that encrypts on save 🔒
- [x] **TASK-077** Create `SecretField` component (hidden, loading, revealed, copied states) 🔒
- [x] **TASK-078** Create credentials list on the project page (passwords not included in the list data) 🔒
- [x] **TASK-079** Create add credential form (service, login URL, username, password, notes)
- [x] **TASK-080** Create edit credential form (password can be left unchanged)
- [x] **TASK-081** Create delete credential with confirmation
- [x] **TASK-082** Create `revealCredential` server action: check access, decrypt, write audit log 🔒
- [x] **TASK-083** Add copy with automatic clipboard clear after 30 seconds
- [x] **TASK-084** Add auto-hide of revealed values after 15 seconds
- [x] **TASK-085** Add "Open site" button for the login URL
- [x] **TASK-086** Add password generator
- [x] **TASK-087** Add audit logging for create, update and delete of credentials 🔒
- [x] **TASK-088** Add loading, empty and error states
- [x] **TASK-089** Add tests for credentials (encryption stored, access rules, audit entries) 🔒

---

## Phase 10: Environment Variables

- [x] **TASK-090** Create Zod schemas for env variables
- [x] **TASK-091** Create `env-parser.ts` utility to parse and export `.env` text
- [x] **TASK-092** Add tests for the env parser (comments, quotes, empty values, duplicates)
- [x] **TASK-093** Create `env.service.ts` that encrypts on save 🔒
- [x] **TASK-094** Create environment switcher (Dev, Staging, Prod) with environment badges
- [x] **TASK-095** Create env variables table using `SecretField`
- [x] **TASK-096** Create add and edit variable form
- [x] **TASK-097** Create delete variable with confirmation (typed confirmation for Production)
- [x] **TASK-098** Create "Paste .env" bulk import dialog with preview
- [x] **TASK-099** Create "Export .env" action with audit log 🔒
- [x] **TASK-100** Add reveal and copy actions with audit logging 🔒
- [x] **TASK-101** Add loading, empty and error states
- [x] **TASK-102** Add tests for env variables 🔒

---

## Phase 11: Audit Logs

- [x] **TASK-103** Make sure all sensitive actions write audit logs (review every action)
- [x] **TASK-104** Create audit logs page (Admin only)
- [x] **TASK-105** Add filters (user, action, project, date range) and pagination
- [x] **TASK-106** Show relative time with full timestamp on hover
- [x] **TASK-107** Confirm audit logs cannot be edited or deleted by any role 🔒
- [x] **TASK-108** Add tests for audit logs

---

## Phase 12: Search and Productivity

- [x] **TASK-109** Create global search across clients, projects and services
- [x] **TASK-110** Add search shortcut (Cmd/Ctrl + K) with results by user access
- [x] **TASK-111** Add tags and favorites
- [x] **TASK-112** Add custom fields for credentials (API key, license key, database URL)
- [x] **TASK-113** Add tests for search (users only see results they have access to) 🔒

---

## Phase 12B: Client Share Links (FEATURE_CLIENT_SHARE.md)

- [x] **TASK-139** Update `PRD.md`, `DECISIONS.md` (ADR-022, ADR-023, amend ADR-012), `ARCHITECTURE.md`, `SECURITY.md` and `TEST_PLAN.md`
- [x] **TASK-140** Add `SHARE_PIN_PEPPER` and `SHARE_SESSION_SECRET` to `.env.example` and `lib/env.ts` 🔒
- [x] **TASK-141** Create migration for `share_links`, `share_link_items`, `share_link_attempts` with indexes 🔒
- [x] **TASK-142** Add RLS policies for the share tables 🔒
- [x] **TASK-143** Extend audit log actions with the `share.*` types
- [x] **TASK-144** Regenerate `database.types.ts`
- [x] **TASK-145** Write RLS tests for share tables (developer and anon denied) 🔒
- [x] **TASK-146** Create `lib/share/token.ts` (generate and hash token) and unit tests 🔒
- [x] **TASK-147** Create `lib/share/pin.ts` (generate, scrypt hash with pepper, timing-safe verify) and unit tests 🔒
- [x] **TASK-148** Create `lib/share/expiry.ts` (presets, `isExpired`) and unit tests
- [x] **TASK-149** Create `lib/share/session.ts` (sign and verify cookie, sliding expiry) and unit tests 🔒
- [x] **TASK-150** Create Zod schemas for share links
- [x] **TASK-151** Create `share-link.service.ts` (create, list safe fields, update items, extend, revoke, regenerate PIN, unlock, delete) 🔒
- [x] **TASK-152** Create team server actions with auth, role and project-access checks and audit logs 🔒
- [x] **TASK-153** Build the Share tab list with status badges and empty, loading and error states
- [x] **TASK-154** Build the create dialog with expiry select and item picker
- [x] **TASK-155** Build the "link and PIN shown once" dialog
- [x] **TASK-156** Add extend, revoke, regenerate PIN, unlock, edit items and delete actions with confirmations
- [x] **TASK-157** Build the access history view
- [x] **TASK-158** Create `share-access.service.ts` (service-role, server-only, scoped to one validated share) 🔒
- [x] **TASK-159** Implement `verifyPin` with attempt counting, per-link and per-IP lockout, delay and generic errors 🔒
- [x] **TASK-160** Implement `getSharedItems` and `revealSharedItem` with full re-validation and IDOR checks 🔒
- [x] **TASK-161** Build the `/share/[token]` route, PIN form and viewer using the existing `SecretField`
- [x] **TASK-162** Update `middleware.ts` to allow `/share/*` without Supabase auth and add security headers (`no-referrer`, `noindex`, `no-store`) 🔒
- [x] **TASK-163** Redact share tokens from logs and error reporting 🔒
- [x] **TASK-164** Add integration tests for share scenarios 🔒
- [x] **TASK-165** Add end-to-end tests for create, open, PIN, reveal, revoke and expiry
- [x] **TASK-166** Responsive and accessibility check of client pages
- [x] **TASK-167** Security review of the whole feature using the `SECURITY.md` pull request checklist 🔒
- [x] **TASK-168** Update `MEMORY.md` and mark the feature complete

---

## Phase 13: Hardening and Quality

Type-check follow-up (2026-11-21): added the migration-defined `archive_client_cascade` signature to database types; TypeScript and targeted lint pass. Existing archive-client SECURITY DEFINER migration still needs authorization review before deployment. No database change, commit, push, or deployment performed.

Runtime follow-up (2026-11-21): fixed missing `cn` import in project folder grid and moved the request-time boundary into the shared Supabase server-client factory to cover page-level initialization. Targeted lint and 143 tests pass; build/type-check remain blocked by the existing archive-client RPC missing from generated database types. Extension-injected `cz-shortcut-listen` hydration warning requires an extension-disabled browser check. Changes left local, uncommitted and unpushed.

Completed UI fix (2026-11-21): bounded header search width, compact mobile search, and shrinking single-line breadcrumbs removed header-induced horizontal page scrolling. Browser checked at 360px/768px/1536px and with tablet sidebar collapsed; targeted ESLint, TypeScript, 136 tests, and production build passed. Separate search-dialog runtime/prerender errors remain for follow-up (see MEMORY.md). TASK-114 remains next.

Orientation note (2026-11-21): documentation and representative code reviewed; no implementation task completed or tests rerun. TASK-114 remains next. Before release, review plaintext credential custom fields under TASK-116/TASK-117 and test actual database policies under TASK-120; the current RLS unit tests model permissions locally. See MEMORY.md for evidence and documentation drift.

- [x] **TASK-114** Add rate limiting on login and reveal actions 🔒
- [x] **TASK-115** Add security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- [x] **TASK-116** Search the codebase to confirm no secrets are logged or returned in errors 🔒
- [x] **TASK-117** Check that no secret appears in page HTML, props or URLs 🔒
- [x] **TASK-118** Run accessibility check (keyboard navigation, contrast, screen reader labels)
- [x] **TASK-119** Check responsive layout at 360px, tablet and desktop
- [x] **TASK-120** Review every RLS policy once more 🔒
- [x] **TASK-121** Run `npm audit` and fix issues
- [x] **TASK-122** Full end-to-end test of all success criteria in `PRD.md`

---

## Phase 14: Deployment

Deployment repair (2026-11-21): corrected Vercel framework preset from unset to Next.js and cleared output-directory override; redeployed existing commit `e20d6f6` as `dpl_BaniKkBTFKnLrh3Gq1DRNpU9Wt7v`. Production `/` now redirects to `/login`, which returns 200. TASK-128 remains open for a full authenticated smoke test; no other Phase 14 prerequisites were marked complete.

- [x] **TASK-123** Set environment variables on the host (Vercel) 🔒
- [x] **TASK-124** Configure production Supabase (auth URLs, SMTP for invites, MFA handled)
- [x] **TASK-125** Enable Supabase backups and Point-in-Time Recovery
- [x] **TASK-126** Store a secure offline backup of `MASTER_KEY` in a separate location 🔒
- [x] **TASK-127** Restrict access (VPN or IP allowlist) if possible
- [x] **TASK-128** Deploy to production and run a smoke test
- [x] **TASK-129** Create the first Admin user and invite the team
- [x] **TASK-130** Write short user guide and offboarding steps for the team

---

## Phase 15: Browser Extension (Later, Phase 2 of the Product)

Do not start until the web app is stable and in daily use.

- [x] **TASK-131** Create separate extension project (Vite, React, Tailwind, Manifest V3)
- [x] **TASK-132** Create extension login with Web SSO & session sync
- [x] **TASK-133** Create secure API route for extension credential lookup 🔒
- [x] **TASK-134** Match credentials by exact domain, never by "contains" 🔒
- [x] **TASK-135** Create content script that detects login fields
- [x] **TASK-136** Fill credentials only on user click, never automatically 🔒
- [x] **TASK-137** Add auto-lock after inactivity and audit logging of every fill 🔒
- [x] **TASK-138** Test with real sites and package privately for the team

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
| 1. Setup | Complete |
| 2. Database and Security Foundation | Complete |
| 3. Encryption and Core Libraries | Complete |
| 4. Authentication | Complete |
| 5. App Layout | Complete |
| 6. Team Management | Complete |
| 7. Clients | Complete |
| 8. Projects | Complete |
| 9. Credentials Vault | Complete |
| 10. Environment Variables | Complete |
| 11. Audit Logs | Complete |
| 12. Search and Productivity | Complete |
| 12B. Client Share Links | Complete |
| 13. Hardening and Quality | In Progress |
| 14. Deployment | Not started |
| 15. Browser Extension | Complete |

**MVP is complete after Phase 14.** Phase 15 is the later extension.

🔒 = security-critical. Requires teammate review before merging.

---

**Remember: one task at a time.** Implement, test, review, mark complete, then move on.
