# Project Memory

This file is the current state of the project. Update it at the end of every work session and after every completed task. AI tools must read it at the start of every session and update it at the end.

**Last updated:** 2026-11-21

Related documents:
- `DECISIONS.md`: permanent decisions (rarely changes)
- `MEMORY.md`: current project state (changes often)
- `TASKS.md`: full task breakdown (138 tasks across 15 phases)

---

## Current Status

Phases 1 through 10 are complete. Database schema, security foundation, AES-256-GCM encryption libraries, Supabase clients, fail-closed audit logging, full authentication flow (Login, MFA, password reset, invites), responsive App Layout (shadcn Sidebar, Breadcrumbs, Avatar, DataTable, ThemeToggle), full Team Management (Admin controls, immediate revocation), complete Client Management, complete Project Management (folder-based grid view, responsive slide-over edit sheet, project detail view with responsive tabs), complete Credentials Vault (AES-256-GCM password encryption on save, `SecretField` with reveal auto-hide after 15s and copy clipboard auto-clear after 30s), and complete Environment Variables Manager (AES-256-GCM encryption on save, environment switcher for Dev/Staging/Prod, SecretField table, typed delete confirmation for Production, Paste .env bulk import with live preview, Export .env file download with audit logging, and 115/115 passing unit tests) are implemented, verified, and passing all tests.

**Overall progress:** 101 of 138 tasks complete (73%) — 1 skipped per user preference (TASK-005).

---

## Project Summary

**Product:** Company Vault, an internal password and secrets manager for client projects.

**Theme:** Permanent Dark Mode Only (no light/system toggles per user mandate).

**What it stores:** client details, project service logins (Supabase, Cloudinary, Vercel, etc.) and environment variables per project (dev, staging, production).

**Stack:** Next.js (App Router, Turbopack), TypeScript, Supabase (Postgres, Auth, RLS), shadcn/ui (Base UI primitives, zinc theme), Tailwind CSS v4, Zustand (client state).

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
- [x] **TASK-008**: Install core packages (`@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `server-only`, `sonner`, `lucide-react`, `zustand`)
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

### Phase 6: Team Management (Admin) (6/6 complete)
- [x] **TASK-049**: Create `src/services/user.service.ts` (list users, invite, update role, deactivate/reactivate)
- [x] **TASK-050**: Create team list page at `src/app/(dashboard)/team/page.tsx` (Admin only)
- [x] **TASK-051**: Create invite user form and action (`InviteUserDialog.tsx`, `inviteUserAction`) using service role (server-only)
- [x] **TASK-052**: Add change role and deactivate/reactivate actions (`updateUserRoleAction`, `setUserStatusAction`)
- [x] **TASK-053**: Ensure deactivated users lose access immediately via `adminClient.auth.admin.signOut(userId)`
- [x] **TASK-054**: Add unit tests for team management schemas, role constraints, and Zustand filter store (`src/test/team-management.test.ts`)

### Phase 7: Clients (9/9 complete)
- [x] **TASK-055**: Create Zod schemas for clients (`src/features/clients/schemas.ts`)
- [x] **TASK-056**: Create `src/services/client.service.ts` (listClients, getClientById, createClient, updateClient, archiveClient)
- [x] **TASK-057**: Create client server actions with role checks (`createClientAction`, `updateClientAction`, `archiveClientAction`)
- [x] **TASK-058**: Create clients list page at `src/app/(dashboard)/clients/page.tsx` with search and status filtering
- [x] **TASK-059**: Create add and edit client dialog (`ClientFormDialog.tsx`) using shadcn components and React Hook Form
- [x] **TASK-060**: Add archive client functionality with `ConfirmDialog`
- [x] **TASK-061**: Create client detail page at `src/app/(dashboard)/clients/[id]/page.tsx` showing client details and associated projects
- [x] **TASK-062**: Add loading, empty, and error states across client views
- [x] **TASK-063**: Add unit tests for client schemas, operations, and Zustand filter store (`src/test/client-management.test.ts`)

### Phase 8: Projects (11/11 complete)
- [x] **TASK-064**: Create Zod schemas for projects (`src/features/projects/schemas.ts`)
- [x] **TASK-065**: Create `src/services/project.service.ts` (listProjects with RLS, getProjectById with details, createProject, updateProject, archiveProject, assignProjectMember, removeProjectMember)
- [x] **TASK-066**: Create project server actions with role checks (`createProjectAction`, `updateProjectAction`, `archiveProjectAction`, `assignProjectMemberAction`, `removeProjectMemberAction`)
- [x] **TASK-067**: Create projects list page at `src/app/(dashboard)/projects/page.tsx` (< 25 lines) with folder-based grid view as default and view mode toggle
- [x] **TASK-068**: Create add project form dialog (`ProjectFormDialog.tsx`) streamlined to Client Organization and Project (Folder) Name, and responsive slide-over sheet for editing (`ProjectEditSheet.tsx`: 100% full screen on mobile, max-w-lg on desktop) for all metadata, URLs, and settings
- [x] **TASK-069**: Add archive and restore project functionality with `ConfirmDialog`
- [x] **TASK-070**: Create project detail page at `src/app/(dashboard)/projects/[id]/page.tsx` (< 25 lines) with responsive horizontal-scrolling tabs (Credentials, Env Variables, Team Members, Overview)
- [x] **TASK-071**: Add assign and remove team members on a project (`ProjectMembersTab.tsx`)
- [x] **TASK-072**: Confirm Developers see only assigned projects (RLS verification & isolated data access) 🔒
- [x] **TASK-073**: Add loading, empty, and error states across all project views
- [x] **TASK-074**: Add unit tests for projects, schemas, store, and access rules (`src/test/project-management.test.ts`)

---

### Phase 9: Credentials Vault (15/15 complete)
- [x] **TASK-075**: Create Zod schemas for credentials (`src/features/credentials/schemas.ts`)
- [x] **TASK-076**: Create `credential.service.ts` encrypting passwords on save with AES-256-GCM and unique IVs 🔒
- [x] **TASK-077**: Create `SecretField` component with hidden, loading, revealed, and copied states (`src/components/secret-field.tsx`) 🔒
- [x] **TASK-078**: Create credentials list on the project page with passwords excluded from list payload 🔒
- [x] **TASK-079**: Create add credential form with service, login URL, username, password, notes (`CredentialFormDialog.tsx`)
- [x] **TASK-080**: Create edit credential form allowing password to remain unchanged
- [x] **TASK-081**: Create delete credential with `ConfirmDialog`
- [x] **TASK-082**: Create `revealCredentialAction` server action with RLS check, decryption, and audit logging 🔒
- [x] **TASK-083**: Add copy to clipboard with automatic clear after 30 seconds
- [x] **TASK-084**: Add auto-hide of revealed passwords after 15 seconds with countdown badge
- [x] **TASK-085**: Add "Open site" button for login URL
- [x] **TASK-086**: Add cryptographically secure password generator (`src/utils/password-generator.ts`)
- [x] **TASK-087**: Add fail-closed audit logging for create, update, delete, reveal, and copy actions 🔒
- [x] **TASK-088**: Add loading, empty, and error states across credential vault views
- [x] **TASK-089**: Add unit tests for credentials, encryption round trip, generator, and access rules (`src/test/credential-management.test.ts`)

---

### Phase 10: Environment Variables (13/13 complete)
- [x] **TASK-090**: Create Zod schemas for env variables (`src/features/env-variables/schemas.ts`)
- [x] **TASK-091**: Create `src/utils/env-parser.ts` utility to parse and export `.env` text (handles quotes, multiline, inline comments, empty values, duplicates)
- [x] **TASK-092**: Add unit tests for env parser (`src/test/env-parser.test.ts`)
- [x] **TASK-093**: Create `src/services/env.service.ts` that encrypts on save with AES-256-GCM and unique IVs 🔒
- [x] **TASK-094**: Create environment switcher (Dev, Staging, Prod) with color-coded badges and counts (`EnvSwitcher.tsx`)
- [x] **TASK-095**: Create env variables table using `SecretField` with reveal and copy auto-protection (`EnvVariablesTable.tsx`)
- [x] **TASK-096**: Create add and edit variable form dialog (`EnvVariableFormDialog.tsx`) with key generator
- [x] **TASK-097**: Create delete variable confirmation with typed key safety confirmation for Production (`DeleteEnvConfirmDialog.tsx`)
- [x] **TASK-098**: Create "Paste .env" bulk import dialog with live parsing preview and overwrite toggle (`PasteEnvDialog.tsx`)
- [x] **TASK-099**: Create "Export .env" action with file download and fail-closed audit log (`ExportEnvDialog.tsx`) 🔒
- [x] **TASK-100**: Add reveal and copy actions with fail-closed audit logging (`revealEnvVariableAction`) 🔒
- [x] **TASK-101**: Add loading, empty, and error states across environment variables views (`ProjectEnvTab.tsx`)
- [x] **TASK-102**: Add unit tests for env variables, schemas, encryption round-trip, production confirmation, and export (`src/test/env-variables.test.ts`) 🔒

---

## Current Task

**TASK-103:** Make sure all sensitive actions write audit logs (review every action) (Phase 11: Audit Logs)

**Phase:** 11, Audit Logs

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
| 6. Team Management | Complete | 6 / 6 |
| 7. Clients | Complete | 9 / 9 |
| 8. Projects | Complete | 11 / 11 |
| 9. Credentials Vault | Complete | 15 / 15 |
| 10. Environment Variables | Complete | 13 / 13 |
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
| Test suite | Vitest: 92 / 92 unit tests passing |
| Production build | `next build` passing with 0 errors |

---

## Active Test Accounts (Supabase Auth)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@vault.local` | `AdminPassword123!` |
| **Manager** | `manager@vault.local` | `ManagerPassword123!` |
| **Developer** | `developer@vault.local` | `DevPassword123!` |

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
| 2026-11-21 | Added Zustand & strict shadcn rules across docs; Completed Phase 6 (Team Management, Admin controls, immediate revocation, Zustand filtering, 46/46 tests passing) | Phase 7: Clients |
| 2026-11-21 | Completed Phase 7 (Client Management: list, detail view with projects, create/edit dialog, archive/restore, Zustand search & filtering, audit logs, 54/54 tests passing) | Phase 8: Projects |
| 2026-11-21 | Completed Phase 8 (Project Management: list, folder grid view as default, detail view with tabs, create/edit dialog, archive/restore, member assignment & removal, Zustand store, 72/72 tests passing) | Phase 9: Credentials Vault |
| 2026-11-21 | Completed Phase 9 (Credentials Vault: AES-256-GCM encryption on save, SecretField with 15s auto-hide and 30s clipboard auto-clear, password generator, open site, fail-closed audit logs, 92/92 tests passing, build passing) | Phase 10: Environment Variables |
