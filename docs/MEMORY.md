# Project Memory

This file is the current state of the project. Update it at the end of every work session and after every completed task. AI tools must read it at the start of every session and update it at the end.

**Last updated:** 2026-11-21

Related documents:
- `DECISIONS.md`: permanent decisions (rarely changes)
- `MEMORY.md`: current project state (changes often)
- `TASKS.md`: full task breakdown (138 tasks across 15 phases)

---

## Current Status

Phases 1, 2, 3, 4, and 5 are complete. Database schema, security foundation, AES-256-GCM encryption libraries, Supabase clients, fail-closed audit logging, full authentication flow (Login, MFA enrollment/verify, forgot/reset password, invite acceptance, and middleware guards), and responsive App Layout (composed with official shadcn components: `Sidebar`, `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `Breadcrumb`, `Avatar`, `DataTable`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `ThemeToggle`, and the dashboard overview home page) are implemented, verified, and passing all tests.

**Overall progress:** 47 of 138 tasks complete (34%) — 1 skipped per user preference (TASK-005).

---

## Project Summary

**Product:** Company Vault, an internal password and secrets manager for client projects.

**What it stores:** client details, project service logins (Supabase, Cloudinary, Vercel, etc.) and environment variables per project (dev, staging, production).

**Stack:** Next.js (App Router, Turbopack), TypeScript, Supabase (Postgres, Auth, RLS), shadcn/ui (Base UI primitives, zinc theme), Tailwind CSS v4, Zustand (for client state if needed).

**Requested by:** Software company manager.

---

## Completed Tasks

### Phase 1: Setup (11/12 complete, 1 skipped)
- [x] **TASK-001**: Initialize Next.js project with TypeScript, App Router and `src/` directory
- [x] **TASK-002**: Enable TypeScript `strict` mode and configure ESLint and Prettier
- [x] **TASK-003**: Configure Tailwind CSS (Tailwind v4 with `@theme inline` and shadcn integration)
- [x] **TASK-004**: Initialize shadcn/ui and add base components (Base UI primitives, zinc theme)
- [-] **TASK-005**: Apply `DESIGN.md` theme fonts/colors *(Skipped per user request: keep installed shadcn base theme)*
- [x] **TASK-006**: Create folder structure from `ARCHITECTURE.md`
- [x] **TASK-007**: Configure Git (`main` branch), `.gitignore`, and `.env.example`
- [x] **TASK-008**: Install core packages (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `sonner`, `lucide-react`)
- [x] **TASK-009**: Set up testing tools (Vitest, React Testing Library, jsdom)
- [x] **TASK-010**: Create a new, separate Supabase project for the vault (`https://wyycdjxqffgtraqukqjb.supabase.co`)
- [x] **TASK-011**: Set up validated environment variables in `lib/env.ts`
- [x] **TASK-012**: Disable public signup (enforce invite-only accounts)

### Phase 2: Database and Security Foundation (12/12 complete)
- [x] **TASK-013**: Set up Supabase CLI and `supabase/migrations/` folder
- [x] **TASK-014**: Create `profiles` table (role, status) linked to Supabase Auth users, with RLS
- [x] **TASK-015**: Create `clients` table with RLS
- [x] **TASK-016**: Create `projects` table with RLS
- [x] **TASK-017**: Create `project_members` table with RLS
- [x] **TASK-018**: Create `credentials` table with RLS
- [x] **TASK-019**: Create `env_variables` table with RLS
- [x] **TASK-020**: Create append-only `audit_logs` table with RLS and immutable Postgres trigger
- [x] **TASK-021**: Create helper SQL functions for role and project-access checks (`is_admin`, `is_manager_or_admin`, `has_project_access`, `has_client_access`)
- [x] **TASK-022**: Generate TypeScript types into `src/types/database.types.ts`
- [x] **TASK-023**: Write RLS tests in `src/test/rls-policies.test.ts`
- [x] **TASK-024**: Create seed data in `supabase/seed.sql`

### Phase 3: Encryption and Core Libraries (7/7 complete)
- [x] **TASK-025**: Generate `MASTER_KEY` (64-hex char AES-256-GCM key) in `.env.local`
- [x] **TASK-026**: Create `src/lib/crypto.ts` with AES-256-GCM encryption and decryption (`server-only`)
- [x] **TASK-027**: Add crypto tests in `src/test/crypto.test.ts` (round trip, unique IVs, tamper detection, wrong key fails)
- [x] **TASK-028**: Create Supabase clients in `src/lib/supabase/` (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`)
- [x] **TASK-029**: Create `src/lib/auth.ts` with `getCurrentUser()`, `requireRole()`, `requireAdmin()`, `requireManagerOrAdmin()`
- [x] **TASK-030**: Create `src/services/audit.service.ts` with fail-closed `logAction()`
- [x] **TASK-031**: Create shared action result type (`ActionResult<T>`) and safe error helpers in `src/lib/action-result.ts`

### Phase 4: Authentication (10/10 complete)
- [x] **TASK-032**: Create login page with shadcn UI and React Hook Form (`src/app/(auth)/login/page.tsx`, `LoginForm.tsx`)
- [x] **TASK-033**: Configure Supabase Auth cookie session handling via `@supabase/ssr`
- [x] **TASK-034**: Create `src/middleware.ts` protecting dashboard routes and preserving Server Action RPC headers (`next-action`)
- [x] **TASK-035**: Create MFA enrollment page (`src/app/(auth)/mfa/enroll/page.tsx`, `MfaEnrollForm.tsx`)
- [x] **TASK-036**: Create MFA verification step on login (`src/app/(auth)/mfa/page.tsx`, `MfaVerifyForm.tsx`)
- [x] **TASK-037**: Enforce MFA verification in middleware and server actions (`loginAction`, `verifyMfaAction`, `enrollMfaAction`)
- [x] **TASK-038**: Add logout (`logoutAction`) and session refresh handling
- [x] **TASK-039**: Create forgot password (`/forgot-password`) and reset password (`/reset-password`) flow
- [x] **TASK-040**: Create accept-invite page (`/accept-invite`) for new team members
- [x] **TASK-041**: Add authentication schema tests in `src/test/auth-schemas.test.ts`

### Phase 5: App Layout (7/7 complete)
- [x] **TASK-042**: Create dashboard layout with official shadcn sidebar (`SidebarProvider`, `Sidebar`, `SidebarInset`) and header
- [x] **TASK-043**: Make sidebar responsive (built-in mobile Sheet and `SidebarTrigger`)
- [x] **TASK-044**: Show sidebar items by role (hide Team and Audit Logs from developer role)
- [x] **TASK-045**: Add official shadcn `Breadcrumb` component (`src/components/layout/Breadcrumbs.tsx`)
- [x] **TASK-046**: Add dark mode toggle with `next-themes` (`src/components/layout/ThemeToggle.tsx`)
- [x] **TASK-047**: Create reusable `DataTable`, `EmptyState`, `ErrorState`, and `ConfirmDialog` components using shadcn primitives
- [x] **TASK-048**: Create dashboard home page (`src/app/(dashboard)/page.tsx` < 25 lines) with client/project metric cards and quick actions

---

## Current Task

**TASK-049:** Create `user.service.ts` (Phase 6: Team Management)

**Phase:** 6, Team Management (Admin)

**Status:** Ready to start

---

## Phase Progress

| Phase | Status | Tasks done |
|---|---|---|
| 1. Setup | Complete (1 skipped per user) | 11 / 12 |
| 2. Database and Security Foundation | Complete | 12 / 12 |
| 3. Encryption and Core Libraries | Complete | 7 / 7 |
| 4. Authentication | Complete | 10 / 10 |
| 5. App Layout | Complete | 7 / 7 |
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
| Git repository | Clean working tree on `main` branch |
| Next.js project | Next.js 16 (Turbopack, App Router, React 19) in `src/` |
| Supabase remote project | Configured at `https://wyycdjxqffgtraqukqjb.supabase.co` |
| Database migrations | Initial schema applied in `supabase/migrations/20261121000000_initial_schema.sql` |
| Permissions grant script | Created in `supabase/setup_profiles.sql` |
| `MASTER_KEY` | Generated (64-hex chars) in `.env.local` |
| Test suite | Vitest: 38 / 38 unit tests passing |
| Production build | `next build` passing with 0 errors |

---

## Active Test Accounts (Supabase Auth)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@vault.local` | `AdminPassword123!` |
| **Manager** | `manager@vault.local` | `ManagerPassword123!` |
| **Developer** | `developer@vault.local` | `DevPassword123!` |

---

## Known Issues and Fixes

- [x] **Fixed:** Replaced custom sidebar and breadcrumb implementations with official shadcn components (`npx shadcn add sidebar breadcrumb avatar`).
- [x] **Fixed:** Middleware intercepted Server Action RPC requests (`POST /` with `next-action` header), causing `Uncaught Error: An unexpected response was received from the server`. Resolved in `src/middleware.ts` by passing through requests with `next-action` and preserving session cookies.
- [x] **Fixed:** Next.js 16 Partial Prefetching / Cache Components blocking dynamic routes: configured `export const instant = false` on dashboard layout.
- [x] **Fixed:** JSDOM mock for `window.matchMedia` added to `src/test/setup.ts` to support shadcn `useIsMobile`.

---

## Session Log

| Date | Work done | Next |
|---|---|---|
| 2026-11-21 | Wrote PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS and MEMORY | Start TASK-001 |
| 2026-11-21 | Completed Phase 1 (Next.js, Tailwind v4, shadcn, Vitest, Env validation) | Phase 2 |
| 2026-11-21 | Completed Phase 2 (Database Schema, Tables, RLS, Helper Functions, Types, RLS Tests, Seed) | Phase 3 |
| 2026-11-21 | Completed Phase 3 (AES-256-GCM Crypto, Supabase Clients, Auth Helpers, Audit Service) | Phase 4 |
| 2026-11-21 | Completed Phase 4 (Full Auth: Login, MFA, Password Reset, Invite Acceptance, Middleware) | Test credentials |
| 2026-11-21 | Created test accounts in Supabase Auth (`admin`, `manager`, `developer`), resolved Server Action middleware redirect bug | Phase 5 |
| 2026-11-21 | Completed Phase 5 using official shadcn components (`sidebar`, `breadcrumb`, `avatar`, `alert-dialog`, `table`). 38/38 tests passing, build passing | Phase 6: Team Management |
