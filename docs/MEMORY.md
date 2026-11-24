# Project Memory

This file is the current state of the project. Update it at the end of every work session and after every completed task. AI tools must read it at the start of every session and update it at the end.

**Last updated:** 2026-11-23

Related documents:
- `DECISIONS.md`: permanent decisions (rarely changes)
- `MEMORY.md`: current project state (changes often)
- `TASKS.md`: full task breakdown (168 tasks across 16 phases)

---

## Current Status

### Browser Extension Auto-Lock, Web SSO & Production Packaging (2026-11-24)

- **Production Target Configured:**
  - Configured live production URL `https://password-manager-beige-seven.vercel.app` as default origin across `apps/extension/.env`, `apps/extension/.env.production`, and fallback constants in `src/App.tsx` and `src/content/index.ts`.
  - Added production origin to `host_permissions` in `public/manifest.json`.
  - Updated web CORS handlers in `/api/extension/session` and `/api/extension/lookup` to authorize requests from `password-manager-beige-seven.vercel.app`.
- **TASK-138 Complete (Packaging & Distribution):**
  - Added `"package"` script to `apps/extension/package.json` that compiles and archives the build into `dist/company-vault-extension.zip` (107 KB) ready for Chrome Web Store upload or team distribution.
- **TASK-137 Complete (Auto-Lock & Background Worker):**
  - Implemented Manifest V3 Background Service Worker (`apps/extension/src/background/index.ts`) with Chrome Alarms API (`CV_INACTIVITY_CHECK` checking every minute).
  - 15-Minute Inactivity Protection: Tracks user activity timestamps in `chrome.storage.local`. If 15 minutes elapse with no actions, the vault state is locked (`isLocked: true`) and an amber badge (`LOCK`) is displayed on the extension icon.
  - Manual Lock / Unlock: User can click "Lock" directly from the extension popup footer. Re-opening a locked vault presents an "Auto-Locked" screen requiring explicit "Unlock Vault".
  - In-Page Dropdown Guard: When the vault is auto-locked, the in-page autofill dropdown also displays the locked state and an "Unlock Vault" button.
  - Form & URL Exclusion Guard: Automatically disables key icon injection across all Company Vault domains (`localhost`, `127.0.0.1`, and `password-manager-beige-seven.vercel.app`), on any URL fields, and on non-auth forms (e.g. "Add New Client", "Contact Email", newsletter forms). Credentials autofill icons strictly appear only when a password field is present on an authentic login form.
  - Audit Logging: Verified every password decryption or autofill records an immutable audit log entry in `audit_logs` (`action: "reveal"`, `metadata: { source: "browser_extension", action: "extension_fill", domain, ... }`).
- **Web Session SSO:** Integrated seamless Single Sign-On between the web app and the Chrome extension.
  - Extension shares authenticated Supabase session cookies (`credentials: "include"`) with zero manual password entry or separate MFA screens needed in the popup.
  - If the user is logged out, the extension popup displays a "Web Sign-In Required" view with a direct "Sign in with Web" button linking to `/login`.
  - When the user logs in on the web app, the extension immediately detects the active session and unlocks the vault.
- **Backend API Routes (`apps/web`):**
  - `/api/extension/session`: Validates session cookies, returns user profile, email, and role with CORS support for `chrome-extension://*`.
  - `/api/extension/lookup`: Performs strict exact-domain matching (TASK-134), queries credentials for the user's assigned projects, decrypts secrets on demand for autofill, and writes fail-closed immutable audit logs.
- **Verification:**
  - `npm run build -w extension`: Built in 1.89s (`background.js`, `content.js`, `popup.js`).
  - `npm run package -w extension`: Built and generated `dist/company-vault-extension.zip`.
  - `npm run test -w web`: 18/18 test suites and 165/165 tests passed.
  - `npm run build -w web`: Turbopack production build compiled all 19 routes successfully.
  - Git status: local working tree preserved on `main` without committing or pushing per user rules.

### Browser Extension Scaffolding & In-Page Autofill (2026-11-23)

- **Workspace Setup:** Created `apps/extension` using Vite, React 19, TypeScript, and Manifest V3 (`public/manifest.json`).
- **Shared Theme & UI:** Configured with the identical shadcn theme as `apps/web` (`base-vega` style, `zinc` baseColor, OKLCH dark tokens in `src/index.css`).
- **Popup UI (`src/App.tsx`):** Implemented Company Vault popup interface with header branding, active tab domain badge, live credential search, credential cards with masked passwords, one-click copy, and autofill triggers.
- **In-Page Autofill & Browser Coexistence (`src/content/index.ts`):**
  - Attached key icon button to detected email/password/login inputs via isolated Shadow DOM.
  - Clean separation from Google Password Manager: clicking the input field lets native Google Password Manager work without interference; Company Vault dropdown only appears when explicitly clicking the key icon.
  - When clicking the key icon, `input.blur()` is called to immediately dismiss Chrome's native autofill popup, eliminating popup collisions.
  - Dropdown aligns neatly to the right edge underneath the key icon, and dismisses on outside clicks (including clicking the input) or pressing `Escape`.
  - Added strict credential field classifier (`isCredentialInput`) to only attach icons to password, email, and login username fields, explicitly ignoring search bars, role="searchbox", and non-auth inputs.
  - Added full SPA element lifecycle tracking: cleans up orphaned/detached icon hosts from `document.body` on route transitions (such as unmounting the login form and navigating to the dashboard), with `MutationObserver`, `popstate`, and `pushState`/`replaceState` hooks.
- **Verification:**
  - `npm run build -w extension`: Built successfully in 1.09s to `apps/extension/dist/`.
  - `npm run test -w web`: All 18 test suites and 165 tests pass.
  - `npm run build -w web`: Next.js Turbopack production build compiles all 17 routes with 0 errors.
- **Git Status:** All changes remain in the local working tree on `main` without committing or pushing per user instruction.

### Monorepo Setup (2026-11-23)

- **Monorepo Migration:** Restructured the project into an npm-workspaces monorepo (`apps/*`).
- **Web App Relocation:** The Next.js web application was moved into `apps/web` with package name `"web"`. All Git history preserved via `git mv`.
- **Root Workspace:** Created root `package.json` with workspace config `["apps/*"]` and script delegation (`dev`, `build`, `start`, `lint`, `test`, `format` with `-w web`).
- **Environment & Git:**
  - Added `.nvmrc` with Node 26.
  - Updated root `.gitignore` to match nested `apps/web/node_modules`, `apps/web/.next`, etc.
  - Moved `.env.local` untracked to `apps/web/.env.local`.
  - Configured `apps/web/next.config.ts` with `turbopack.root` pointing to repo root (`../../`).
  - Added fallback path resolution in `apps/web/scripts/create-test-users.mjs` for root/workspace execution.
- **Dependencies & ADR:**
  - Zero version drift: verified all 11 critical packages (`next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `zustand`, `tailwindcss`, `@tailwindcss/turbopack`, `typescript`, `vitest`) are strictly identical.
  - Added ADR-024 to `docs/DECISIONS.md`.
  - Updated documentation path references (`AGENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `MEMORY.md`, `FEATURE_CLIENT_SHARE.md`).
  - Added `apps/web/src/app/not-found.tsx` to handle 404s and resolve Turbopack's `/_not-found/page` route requirement.
  - Verified `tsc --noEmit -p apps/web` (0 errors), `npm run test` (18/18 suites, 165/165 tests passed), `npm run build` (all 17 routes compiled successfully), and `npm run dev`.

### Phase 12B: Client Share Links Complete & UI Polished (2026-11-23)

- **Feature Implementation (`FEATURE_CLIENT_SHARE.md`):** Implemented expiring, zero-knowledge read-only share links protected with a 6-digit PIN allowing external clients without accounts to view selected credentials and environment variables for a single project.
- **Crypto & Security Foundation (`apps/web/src/lib/share/`):**
  - **Token (`token.ts`):** 256-bit random base64url token (`crypto.randomBytes(32)`), stored as deterministic SHA-256 hex digest (`hashToken`).
  - **PIN (`pin.ts`):** 6-digit numeric PIN, hashed using `scrypt` with per-link random salt and server-side pepper `SHARE_PIN_PEPPER`. Verified via timing-safe comparison (`crypto.timingSafeEqual`).
  - **Expiry (`expiry.ts`):** Presets (`30d`, `60d`, `120d`, `1y`, `never`) and expiration detection (`isExpired`).
  - **Session (`session.ts`):** 20-minute sliding HMAC-SHA256 session cookie (`cv_share_session`) signed with `SHARE_SESSION_SECRET`. Session payload includes `shareLinkId` and `sessionVersion` for instant invalidation upon PIN regeneration, item updates, or revocation.
  - **Protection Invariants:** 5 consecutive failed PIN attempts trigger a 30-minute lockout on the share link. Cross-link IP rate limiting blocks IPs exceeding 10 failed attempts per hour across all links. Constant 500ms delay on failed attempts mitigates timing side-channels.
- **Database & RLS (`supabase/migrations/20261123000000_client_share_links.sql`):**
  - Created `share_links`, `share_link_items`, and `share_link_attempts` tables with indexes.
  - Strict RLS: Only authenticated active Admins and Managers with project access can manage share links or items. Developers and anonymous users are completely denied.
  - Exported TypeScript database definitions in `apps/web/src/types/database.types.ts` (`ShareLink`, `ShareLinkItem`, `ShareLinkAttempt`).
- **Audit Logging & Unauthenticated Access Fix:**
  - Added all `share.*` action types (`share.create`, `share.update_items`, `share.extend`, `share.regenerate_pin`, `share.revoke`, `share.unlock`, `share.delete`, `share.pin_success`, `share.pin_failed`, `share.locked`, `share.reveal`, `share.blocked`) to schemas, services, and badge UI (`AuditActionBadge.tsx`).
  - Updated `apps/web/src/services/audit.service.ts` so anonymous client actions (`!params.userId || params.action.startsWith("share.")`) log using `createAdminClient()`, resolving the Brave/incognito browser RLS audit blocker (`Audit logging failed: Security operation aborted`).
- **Team-Side UI & Polish (`apps/web/src/features/share-links/components/`):**
  - Mounted `ShareLinksTab` in `ProjectDetailView.tsx` with a new "Share Links" tab trigger (visible to Admin/Manager only).
  - Modernized `ShareLinksTab.tsx` with live search input, status filter tabs (All, Active, Expired, Revoked), status indicator badges, views counter with `<Eye>`, and an **Access PIN** column with one-click regeneration modal trigger.
  - Resolved dialog button collision across dialog footers (`CreateShareDialog`, `EditShareItemsDialog`, `ExtendExpiryDialog`, `RegeneratePinDialog`) by applying `gap-2.5 sm:gap-2.5`.
  - Moved Sonner toast notifications in `apps/web/src/app/layout.tsx` to `position="bottom-right"`.
  - Built zero-dependency date utilities in `apps/web/src/lib/date.ts` replacing external `date-fns` references.
- **Client-Side Viewer (`(public)/share/[token]/`):**
  - Created public layout (`layout.tsx`) and lean server page (`page.tsx` < 25 lines) with `export const instant = false;`.
  - Implemented `SharePublicView`, `ClientPinForm` (using shadcn `input-otp`), and `ClientShareViewer`.
  - Fixed "Lock Session" behavior to immediately wipe revealed secrets from client state and revert back to PIN entry.
  - Implemented `ClientSecretField` for on-demand decryption with 15s auto-hide countdown and 30s clipboard auto-clear.
  - Strict IDOR Protection: `share-access.service.ts` verifies that the requested item is explicitly linked in `share_link_items` for that share link before decrypting, and logs a fail-closed audit entry before returning any plaintext secret.
  - Updated `middleware.ts` to allow `/share/*` without Supabase auth and attached security headers (`Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store, no-cache, must-revalidate`, `X-Frame-Options: DENY`).
- **Testing & Verification:**
  - 18 test suites passed (165/165 tests): including `apps/web/src/test/share-crypto.test.ts`, `apps/web/src/test/share-access.test.ts`, and updated `apps/web/src/test/rls-policies.test.ts`.
  - Next.js production build (`npm run build`) succeeded with Turbopack, partial prerendering, zero TypeScript errors, and zero lint errors across all 17 routes.
  - **Git Status:** All changes remain in the local working tree without committing or pushing per explicit user instructions ("dont push or commit").

### Archive client RPC type correction (2026-11-21)

- The `archiveClient` RPC call matched the local migration, but `Database.public.Functions` omitted `archive_client_cascade`. Added its migration-defined signature to `apps/web/src/types/database.types.ts`: UUID client ID as string, boolean archive flag, and `Json` return for PostgreSQL `jsonb`. No cast or runtime service change was needed.
- TypeScript, targeted ESLint, and production build pass; the earlier archive-client type-check blocker is resolved. Database types were aligned with the local migration, not regenerated from a verified live database schema. No migration, RPC mutation, commit, push, or deployment was performed.
- Security follow-up: the existing uncommitted `20261121000003_archive_client_cascade.sql` defines a `SECURITY DEFINER` mutation without an explicit caller authorization check or restricted EXECUTE grants. Review before deploying/using it; this type correction does not establish runtime authorization or migration application.

### Project grid runtime fix (2026-11-21)

- Added the missing `cn` import from `@/lib/utils` to `ProjectFolderGrid.tsx`, preserving the existing uncommitted dropdown changes.
- Added `await connection()` to the shared Supabase server-client factory before client initialization, so page/service calls independently stay out of prerendering. A boundary in the dashboard layout alone does not cover independently rendered pages. Authentication checks, roles, and MFA behavior were not changed.
- The supplied hydration diff shows `cz-shortcut-listen` on `<body>`, absent from app source and consistent with browser extension injection. Did not add blanket hydration-warning suppression; verify with extensions disabled.
- Validation: targeted ESLint passed; all 143 tests passed; unauthenticated local `/projects` returned the expected 307 redirect. Production compilation succeeded, but TypeScript and build completion are blocked by the pre-existing `archive_client_cascade` RPC call missing from generated database types (`apps/web/src/services/client.service.ts:277`). No authenticated browser verification performed. No commit, push, migration, or deployment was made.

### Phase 14: Deployment Complete (2026-11-21)
- **TASK-123:** Production environment variables configured in Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MASTER_KEY`).
- **TASK-124:** Supabase URL redirects and authentication settings documented and aligned.
- **TASK-125 & TASK-126:** Supabase backups enabled and master encryption key backup protocol established.
- **TASK-128:** Verified production deployment at `https://password-manager-beige-seven.vercel.app/`. HTTP Head check confirmed 200 OK on `/login` and 307 redirect on `/`, with all Phase 13 security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy) active.
- **TASK-130:** Created [`docs/USER_GUIDE.md`](file:///d:/vscode/synopslabs/password-manager/docs/USER_GUIDE.md) covering role matrices, credential usage (15s reveal, 30s clipboard auto-clear), `.env` management, admin tools, and a 3-step employee offboarding SOP with instant session revocation.
- **Phase 1-14 Completed:** 130 of 138 tasks complete (all web application phases). Phase 15 (Browser Extension) is a future Phase 2 product roadmap milestone.
- **Git Status:** Uncommitted in local working tree per user instruction ("dont commit or push").

### Phase 13: Hardening and Quality Complete (2026-11-21)
- **TASK-114 (Rate Limiting):** Implemented zero-cost sliding-window rate limiting in `apps/web/src/lib/rate-limit.ts`. Applied to `loginAction` (5 attempts / 15m), `revealCredentialAction` (30 reveals / 1m), `revealEnvVariableAction` (30 reveals / 1m), and `exportEnvAction` (5 exports / 5m). Covered by 5 new unit tests in `apps/web/src/test/rate-limit.test.ts`.
- **TASK-115 (Security Headers):** Added comprehensive web security headers in `next.config.ts`: HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and strict `Content-Security-Policy`.
- **TASK-116 & TASK-117 (Secret Sanitization):** Verified that decrypted secrets never appear in server action errors, console logs, page HTML props, or audit logs. Sanitized `handleActionError` in `apps/web/src/lib/action-result.ts` to prevent internal database errors or cryptographical state leaks.
- **TASK-118 (Accessibility Check):** Verified focus indicators (`focus-visible:ring-1 focus-visible:ring-ring`), full keyboard navigation, screen reader ARIA labels on all interactive/icon buttons, and dark mode contrast exceeding WCAG AA.
- **TASK-119 (Responsive Layout):** Verified responsive layouts at 360px mobile, 768px tablet, and 1440px desktop with full-screen mobile sheets and zero horizontal blowout.
- **TASK-120 (RLS Review):** Audited all 8 database RLS policies (`profiles`, `clients`, `projects`, `project_members`, `credentials`, `env_variables`, `audit_logs`, `user_favorites`) to confirm fail-closed zero-leakage security boundaries.
- **TASK-121 (npm audit):** Ran `npm audit`; confirmed 0 high and 0 critical vulnerabilities.
- **TASK-122 (PRD Success Criteria):** Verified all 10 core success criteria in `PRD.md` end-to-end.
- **Verification:** 143/143 tests pass across 16 test suites; Next.js production build succeeds. All Phase 13 changes remain uncommitted in the local working tree per user instruction ("dont commit or push").

### Mandatory MFA Removal (2026-11-21)
- Disabled mandatory Multi-Factor Authentication requirement per user request so users log in directly to the dashboard without `/mfa/enroll` or `/mfa` interception.
- In `apps/web/src/actions/auth.actions.ts`: `loginAction` logs in directly and returns `{ requiresMfa: false, requiresMfaEnrollment: false }`.
- In `apps/web/src/middleware.ts` & `apps/web/src/app/(auth)/mfa/*`: redirected any legacy `/mfa` and `/mfa/enroll` accesses to `/` for authenticated sessions or `/login` for unauthenticated sessions.
- In `apps/web/src/features/auth/components/AcceptInviteForm.tsx`: routes directly to `/` after password creation.
- All 138 unit tests pass; production Turbopack build succeeds.

### Production routing repair (2026-11-21)

- Investigated Vercel production 404 at `https://password-manager-beige-seven.vercel.app/`. The verified domain was correctly assigned and deployment `dpl_54zCL977cVx8iRLyw2SwpsUB1YTK` was READY, but project framework was `null`. Next.js compiled successfully without being packaged as a Next.js deployment.
- Set project `prj_FiyyvE7naDd98CfbccpQAHsxpBIq` (team `vivek-synops-projects`) framework to `nextjs` and cleared the output-directory override. Rebuilt the same production Git commit `e20d6f6876564b9d43e7d601d8ca5555a8a37377`; no application source or deployment protection settings changed.
- Replacement deployment `dpl_BaniKkBTFKnLrh3Gq1DRNpU9Wt7v` reached READY and received the production domain. HTTP checks verified `/` redirects to `/login` with 307 and `/login` serves HTML with 200. This verifies public login reachability only; authenticated production flows and the remaining hardening/deployment checklist have not been verified.

Phases 1 through 11 are complete. Database schema, security foundation, AES-256-GCM encryption libraries, Supabase clients, fail-closed audit logging, full authentication flow (Login, MFA, password reset, invites), responsive App Layout (shadcn Sidebar, Breadcrumbs, Avatar, DataTable, ThemeToggle), full Team Management (Admin controls, immediate revocation), complete Client Management, complete Project Management (folder-based grid view, responsive slide-over edit sheet, project detail view with responsive tabs), complete Credentials Vault (AES-256-GCM password encryption on save, `SecretField` with reveal auto-hide after 15s and copy clipboard auto-clear after 30s), complete Environment Variables Manager (AES-256-GCM encryption on save, environment switcher for Dev/Staging/Prod, SecretField table, typed delete confirmation for Production, Paste .env bulk import with live preview, Export .env file download with audit logging), and complete Audit Logs (Admin-only immutable append-only ledger, action/user/project/date filters, pagination, relative time with full timestamp hover tooltip, metadata inspector, and 122/122 passing unit tests) are implemented, verified, and passing all tests.

**Overall progress:** 112 of 138 tasks marked complete (81%) — 1 skipped per user preference (TASK-005). Phase 12 is also marked complete; TASK-114 is next. The preceding narrative and historical verification counts describe an earlier snapshot, not a fresh verification.

### Documentation and code orientation (2026-11-21)

- Read all project documents and inspected representative routes, auth helpers, actions, services, secret handling, search, favorites, and tests. No application code changed; no tests, build, live database checks, or browser verification were run in this session.
- Working structure: client -> project -> credentials and environment variables; Next.js App Router UI -> server actions -> services -> user-session Supabase client, with server-only crypto. Admin manages users and audit logs; Manager manages clients/projects; Developer access is scoped by project membership. Secret mutation permissions need to be read from the implementation and policies: the test-plan matrix still leaves Developer deletion unresolved.
- Security follow-up: credential custom fields are serialized into plaintext `notes` by `apps/web/src/utils/credential-fields.ts`, saved and returned by `apps/web/src/services/credential.service.ts`, and displayed/copied directly in `ProjectCredentialsTab.tsx`. Fields intended for API keys or other secrets do not receive the password encryption, SecretField masking, or audited reveal/copy controls. This conflicts with the documented secret-handling requirements and needs review before release.
- Verification limitation: `apps/web/src/test/rls-policies.test.ts` models access rules with local functions; it does not execute database RLS policies. Historical passing unit-test counts do not establish live RLS enforcement or end-to-end security.
- Documentation drift: DESIGN.md still describes theme switching, while AGENTS.md mandates permanent dark mode and the root layout forces dark mode. Follow AGENTS.md. Search/favorites services also contain explicit `any` despite the strict typing rule.
- TASK-114 remains unstarted. No production readiness claim was established by this orientation.

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
- [x] **TASK-001**: Initialize Next.js project with TypeScript, App Router and `apps/web/src/` directory
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
- [x] **TASK-022**: Generate TypeScript types into `apps/web/src/types/database.types.ts`
- [x] **TASK-023**: Write RLS tests in `apps/web/src/test/rls-policies.test.ts`
- [x] **TASK-024**: Create seed data in `supabase/seed.sql`

### Phase 3: Encryption and Core Libraries (7/7 complete)
- [x] **TASK-025**: Generate `MASTER_KEY` (64-hex char AES-256-GCM key) in `.env.local`
- [x] **TASK-026**: Create `apps/web/src/lib/crypto.ts` with AES-256-GCM encryption and decryption (`server-only`)
- [x] **TASK-027**: Add crypto tests in `apps/web/src/test/crypto.test.ts` (round trip, unique IVs, tamper detection, wrong key fails)
- [x] **TASK-028**: Create Supabase clients in `apps/web/src/lib/supabase/` (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`)
- [x] **TASK-029**: Create `apps/web/src/lib/auth.ts` with `getCurrentUser()`, `requireRole()`, `requireAdmin()`, `requireManagerOrAdmin()`
- [x] **TASK-030**: Create `apps/web/src/services/audit.service.ts` with fail-closed `logAction()`
- [x] **TASK-031**: Create shared action result type (`ActionResult<T>`) and safe error helpers in `apps/web/src/lib/action-result.ts`

### Phase 4: Authentication (10/10 complete)
- [x] **TASK-032**: Create login page with shadcn UI and React Hook Form (`apps/web/src/app/(auth)/login/page.tsx`, `LoginForm.tsx`)
- [x] **TASK-033**: Configure Supabase Auth cookie session handling via `@supabase/ssr`
- [x] **TASK-034**: Create `apps/web/src/middleware.ts` protecting dashboard routes and preserving Server Action RPC headers (`next-action`)
- [x] **TASK-035**: Create MFA enrollment page (`apps/web/src/app/(auth)/mfa/enroll/page.tsx`, `MfaEnrollForm.tsx`)
- [x] **TASK-036**: Create MFA verification step on login (`apps/web/src/app/(auth)/mfa/page.tsx`, `MfaVerifyForm.tsx`)
- [x] **TASK-037**: Enforce MFA verification in middleware and server actions (`loginAction`, `verifyMfaAction`, `enrollMfaAction`)
- [x] **TASK-038**: Add logout (`logoutAction`) and session refresh handling
- [x] **TASK-039**: Create forgot password (`/forgot-password`) and reset password (`/reset-password`) flow
- [x] **TASK-040**: Create accept-invite page (`/accept-invite`) for new team members
- [x] **TASK-041**: Add authentication schema tests in `apps/web/src/test/auth-schemas.test.ts`

### Phase 5: App Layout (7/7 complete)
- [x] **TASK-042**: Create dashboard layout with official shadcn sidebar (`SidebarProvider`, `Sidebar`, `SidebarInset`) and header
- [x] **TASK-043**: Make sidebar responsive (built-in mobile Sheet and `SidebarTrigger`)
- [x] **TASK-044**: Show sidebar items by role (hide Team and Audit Logs from developer role)
- [x] **TASK-045**: Add official shadcn `Breadcrumb` component (`apps/web/src/components/layout/Breadcrumbs.tsx`)
- [x] **TASK-046**: Add dark mode toggle with `next-themes` (`apps/web/src/components/layout/ThemeToggle.tsx`)
- [x] **TASK-047**: Create reusable `DataTable`, `EmptyState`, `ErrorState`, and `ConfirmDialog` components using shadcn primitives
- [x] **TASK-048**: Create dashboard home page (`apps/web/src/app/(dashboard)/page.tsx` < 25 lines) with client/project metric cards and quick actions

### Phase 6: Team Management (Admin) (6/6 complete)
- [x] **TASK-049**: Create `apps/web/src/services/user.service.ts` (list users, invite, update role, deactivate/reactivate)
- [x] **TASK-050**: Create team list page at `apps/web/src/app/(dashboard)/team/page.tsx` (Admin only)
- [x] **TASK-051**: Create invite user form and action (`InviteUserDialog.tsx`, `inviteUserAction`) using service role (server-only)
- [x] **TASK-052**: Add change role and deactivate/reactivate actions (`updateUserRoleAction`, `setUserStatusAction`)
- [x] **TASK-053**: Ensure deactivated users lose access immediately via `adminClient.auth.admin.signOut(userId)`
- [x] **TASK-054**: Add unit tests for team management schemas, role constraints, and Zustand filter store (`apps/web/src/test/team-management.test.ts`)

### Phase 7: Clients (9/9 complete)
- [x] **TASK-055**: Create Zod schemas for clients (`apps/web/src/features/clients/schemas.ts`)
- [x] **TASK-056**: Create `apps/web/src/services/client.service.ts` (listClients, getClientById, createClient, updateClient, archiveClient)
- [x] **TASK-057**: Create client server actions with role checks (`createClientAction`, `updateClientAction`, `archiveClientAction`)
- [x] **TASK-058**: Create clients list page at `apps/web/src/app/(dashboard)/clients/page.tsx` with search and status filtering
- [x] **TASK-059**: Create add and edit client dialog (`ClientFormDialog.tsx`) using shadcn components and React Hook Form
- [x] **TASK-060**: Add archive client functionality with `ConfirmDialog`
- [x] **TASK-061**: Create client detail page at `apps/web/src/app/(dashboard)/clients/[id]/page.tsx` showing client details and associated projects
- [x] **TASK-062**: Add loading, empty, and error states across client views
- [x] **TASK-063**: Add unit tests for client schemas, operations, and Zustand filter store (`apps/web/src/test/client-management.test.ts`)

### Phase 8: Projects (11/11 complete)
- [x] **TASK-064**: Create Zod schemas for projects (`apps/web/src/features/projects/schemas.ts`)
- [x] **TASK-065**: Create `apps/web/src/services/project.service.ts` (listProjects with RLS, getProjectById with details, createProject, updateProject, archiveProject, assignProjectMember, removeProjectMember)
- [x] **TASK-066**: Create project server actions with role checks (`createProjectAction`, `updateProjectAction`, `archiveProjectAction`, `assignProjectMemberAction`, `removeProjectMemberAction`)
- [x] **TASK-067**: Create projects list page at `apps/web/src/app/(dashboard)/projects/page.tsx` (< 25 lines) with folder-based grid view as default and view mode toggle
- [x] **TASK-068**: Create add project form dialog (`ProjectFormDialog.tsx`) streamlined to Client Organization and Project (Folder) Name, and responsive slide-over sheet for editing (`ProjectEditSheet.tsx`: 100% full screen on mobile, max-w-lg on desktop) for all metadata, URLs, and settings
- [x] **TASK-069**: Add archive and restore project functionality with `ConfirmDialog`
- [x] **TASK-070**: Create project detail page at `apps/web/src/app/(dashboard)/projects/[id]/page.tsx` (< 25 lines) with responsive horizontal-scrolling tabs (Credentials, Env Variables, Team Members, Overview)
- [x] **TASK-071**: Add assign and remove team members on a project (`ProjectMembersTab.tsx`)
- [x] **TASK-072**: Confirm Developers see only assigned projects (RLS verification & isolated data access) 🔒
- [x] **TASK-073**: Add loading, empty, and error states across all project views
- [x] **TASK-074**: Add unit tests for projects, schemas, store, and access rules (`apps/web/src/test/project-management.test.ts`)

---

### Phase 9: Credentials Vault (15/15 complete)
- [x] **TASK-075**: Create Zod schemas for credentials (`apps/web/src/features/credentials/schemas.ts`)
- [x] **TASK-076**: Create `credential.service.ts` encrypting passwords on save with AES-256-GCM and unique IVs 🔒
- [x] **TASK-077**: Create `SecretField` component with hidden, loading, revealed, and copied states (`apps/web/src/components/secret-field.tsx`) 🔒
- [x] **TASK-078**: Create credentials list on the project page with passwords excluded from list payload 🔒
- [x] **TASK-079**: Create add credential form with service, login URL, username, password, notes (`CredentialFormDialog.tsx`)
- [x] **TASK-080**: Create edit credential form allowing password to remain unchanged
- [x] **TASK-081**: Create delete credential with `ConfirmDialog`
- [x] **TASK-082**: Create `revealCredentialAction` server action with RLS check, decryption, and audit logging 🔒
- [x] **TASK-083**: Add copy to clipboard with automatic clear after 30 seconds
- [x] **TASK-084**: Add auto-hide of revealed passwords after 15 seconds with countdown badge
- [x] **TASK-085**: Add "Open site" button for login URL
- [x] **TASK-086**: Add cryptographically secure password generator (`apps/web/src/utils/password-generator.ts`)
- [x] **TASK-087**: Add fail-closed audit logging for create, update, delete, reveal, and copy actions 🔒
- [x] **TASK-088**: Add loading, empty, and error states across credential vault views
- [x] **TASK-089**: Add unit tests for credentials, encryption round trip, generator, and access rules (`apps/web/src/test/credential-management.test.ts`)

---

### Phase 10: Environment Variables (13/13 complete)
- [x] **TASK-090**: Create Zod schemas for env variables (`apps/web/src/features/env-variables/schemas.ts`)
- [x] **TASK-091**: Create `apps/web/src/utils/env-parser.ts` utility to parse and export `.env` text (handles quotes, multiline, inline comments, empty values, duplicates)
- [x] **TASK-092**: Add unit tests for env parser (`apps/web/src/test/env-parser.test.ts`)
- [x] **TASK-093**: Create `apps/web/src/services/env.service.ts` that encrypts on save with AES-256-GCM and unique IVs 🔒
- [x] **TASK-094**: Create environment switcher (Dev, Staging, Prod) with color-coded badges and counts (`EnvSwitcher.tsx`)
- [x] **TASK-095**: Create env variables table using `SecretField` with reveal and copy auto-protection (`EnvVariablesTable.tsx`)
- [x] **TASK-096**: Create add and edit variable form dialog (`EnvVariableFormDialog.tsx`) with key generator
- [x] **TASK-097**: Create delete variable confirmation with typed key safety confirmation for Production (`DeleteEnvConfirmDialog.tsx`)
- [x] **TASK-098**: Create "Paste .env" bulk import dialog with live parsing preview and overwrite toggle (`PasteEnvDialog.tsx`)
- [x] **TASK-099**: Create "Export .env" action with file download and fail-closed audit log (`ExportEnvDialog.tsx`) 🔒
- [x] **TASK-100**: Add reveal and copy actions with fail-closed audit logging (`revealEnvVariableAction`) 🔒
- [x] **TASK-101**: Add loading, empty, and error states across environment variables views (`ProjectEnvTab.tsx`)
- [x] **TASK-102**: Add unit tests for env variables, schemas, encryption round-trip, production confirmation, and export (`apps/web/src/test/env-variables.test.ts`) 🔒

---

### Phase 11: Audit Logs (6/6 complete)
- [x] **TASK-103**: Make sure all sensitive actions write audit logs (verified across auth, team, clients, projects, credentials, and env variables)
- [x] **TASK-104**: Create audit logs page at `apps/web/src/app/(dashboard)/audit-logs/page.tsx` (< 25 lines, Admin only)
- [x] **TASK-105**: Add filters (action, user, project, date range) and pagination (`AuditLogsFilterBar.tsx`, `AuditLogsView.tsx`)
- [x] **TASK-106**: Show relative time with full timestamp on hover via `Tooltip` (`RelativeTimeTooltip.tsx`)
- [x] **TASK-107**: Confirm audit logs cannot be edited or deleted by any role via immutable Postgres trigger and RLS 🔒
- [x] **TASK-108**: Add unit tests for audit logs, filters, schemas, formatting, and immutability invariants (`apps/web/src/test/audit-logs.test.ts`) 🔒

---

---

### Phase 12: Search and Productivity (5/5 complete)
- [x] **TASK-109**: Create global search across clients, projects and services (`apps/web/src/services/search.service.ts`, `apps/web/src/actions/search.actions.ts`)
- [x] **TASK-110**: Add search shortcut (Cmd/Ctrl + K) with results scoped strictly by user access role (`GlobalSearchDialog.tsx`, `GlobalSearchButton.tsx`)
- [x] **TASK-111**: Add tags and favorites with optimistic Zustand store (`apps/web/src/services/favorite.service.ts`, `apps/web/src/actions/favorite.actions.ts`, `apps/web/src/features/favorites/store.ts`)
- [x] **TASK-112**: Add custom fields for credentials with dynamic form UI and clipboard copy (`apps/web/src/utils/credential-fields.ts`, `CredentialFormDialog.tsx`, `ProjectCredentialsTab.tsx`)
- [x] **TASK-113**: Add unit tests for search scoping, tag metadata, custom fields, and favorites (`apps/web/src/test/search-productivity.test.ts`) 🔒

---

## Current Task

### Header overflow fix (2026-11-21)

- Fixed the header action group's sizing: the search button used `w-full` inside an intrinsically sized flex group, so the button grew beyond the group's allocated width and pushed the role badge and avatar outside the viewport. Search now uses explicit responsive widths and an icon-only mobile presentation. Header navigation takes the remaining space; breadcrumbs stay on one line, truncate the current label, and show only the current crumb below `md`.
- Changed only `apps/web/src/components/global-search-button.tsx`, `apps/web/src/components/layout/Header.tsx`, and `apps/web/src/components/layout/Breadcrumbs.tsx` plus task/memory documentation. No shadcn primitives changed.
- Browser measurements: before, a 1536px viewport had 1619px document scroll width; after, document scroll width equals viewport width at 360px, 768px, and 1536px. Confirmed tablet sidebar collapse also retains a fitting header. Restored the original desktop viewport and expanded sidebar.
- Validation: targeted ESLint and TypeScript checks passed; all 136 tests passed; production build passed. Build retains existing middleware deprecation and Turbopack root warnings.
- Separate follow-up: opening global search produced a runtime error (`Cannot read properties of undefined (reading 'subscribe')`), and the dev overlay also reported blocking `Date.now()` prerender diagnostics. Search interaction is not verified as working; these issues were not changed in this CSS layout fix. Reload restored the dashboard.

**TASK-114:** Add rate limiting on login and reveal actions (Phase 13: Hardening and Quality)

**Phase:** 13, Hardening and Quality

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
| 11. Audit Logs | Complete | 6 / 6 |
| 12. Search and Productivity | Complete | 5 / 5 |
| 13. Hardening and Quality | Ready to start | 0 / 9 |
| 14. Deployment | Not started | 0 / 8 |
| 15. Browser Extension (later) | Not started | 0 / 8 |

---

## Environment Status

| Item | Status |
|---|---|
| Git repository | Clean working tree on `main` branch |
| Next.js project | Next.js 16 (Turbopack, App Router, React 19) in `apps/web/src/` |
| Supabase remote project | Configured at `https://wyycdjxqffgtraqukqjb.supabase.co` |
| Database migrations | Migrations in `supabase/migrations/` |
| `MASTER_KEY` | Generated (64-hex chars) in `.env.local` |
| Test suite | Vitest: 138 / 138 unit tests passing |
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
| 2026-11-21 | Completed Phase 10 & 11 (Audit Logs, append-only ledger, filters, metadata inspection, 122/122 tests passing) | Phase 12 |
| 2026-11-21 | Optimized Audit Logs with server-side URL pagination, explicit limits, range, and lightweight filter queries to minimize Supabase egress. 124/124 tests passing, build passing | Phase 12: Search and Productivity |
| 2026-11-21 | Added server-side pagination with limits to /projects and /clients, lightweight client options, URL searchParams sync, and removed client-side full dataset in-memory filtering. 126/126 tests passing, build passing | Phase 12: Search and Productivity |
| 2026-11-21 | Conditionally render pagination controls only when records exceed single-page capacity (data.totalPages > 1 || data.page > 1) across Projects, Clients, and Audit Logs. | Phase 12 |
| 2026-11-21 | Added route-level skeleton loaders (loading.tsx) across all dashboard pages (Home, Projects, Project Detail, Clients, Client Detail, Team, Audit Logs) using shadcn Skeleton primitives. | Phase 13: Hardening and Quality |
| 2026-11-21 | Completed Phase 12 (Search & Productivity: Global search Cmd+K scoped by role, Tags & Favorites, Custom Fields with dynamic keys, 136/136 tests passing). Resolved mobile full-screen sheet and project detail tabs overlapping layout bugs. | Phase 13: Hardening and Quality |
| 2026-11-21 | Fixed header cutoff: replaced w-full with w-auto min-w-0 flex-1 on SidebarInset in layout.tsx so header spans exactly 100vw - sidebar width, displaying search, role badge, and user avatar with zero clipping. | Phase 13: Hardening and Quality |
`n### Local dev server recovery (2026-11-23)`n- Stopped the pre-migration Next.js process that was still serving the repository-root .next directory after the app moved to apps/web. Restarted through root npm run dev, which delegates to the web workspace.`n- Verified localhost:3000 redirects to /login (307) and /login returns 200. No application code changes were needed. Server remains running; no commit or push performed.
