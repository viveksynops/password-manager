# Architecture Decisions

This file records important technical decisions for Company Vault and the reasons behind them. Do not change or work around a decision here without discussing it with the team and adding a new ADR that supersedes the old one.

Related documents: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`

**Status values:** Accepted, Superseded, Deprecated

---

## ADR-001: Use Supabase for the backend

**Status:** Accepted

**Decision:** Use Supabase (PostgreSQL, Auth, Storage, Row Level Security) as the backend platform.

**Reason:** It provides a database, authentication, MFA, file storage and access-control policies without us managing our own infrastructure. This keeps the team small and the build time short.

**Consequence:** We depend on Supabase's availability and must follow its security model (RLS on every table).

---

## ADR-002: Use Next.js instead of React + Express

**Status:** Accepted

**Decision:** Use Next.js (App Router) as a unified full-stack framework.

**Reason:** The app does not need a separate backend server. Server Actions and Route Handlers cover all server-side needs, including encryption. One codebase, one deployment.

**Consequence:** Server-only code must be clearly separated from client code (`import "server-only"`).

---

## ADR-003: Use a separate Supabase project for the vault

**Status:** Accepted

**Decision:** The vault runs in its own dedicated Supabase project. It is never shared with any client's project or any other company app.

**Reason:** If a client project is compromised, or a developer mistake exposes a different database, the vault must not be affected. It also keeps access, billing and backups isolated.

**Consequence:** Extra project to maintain, but a much smaller blast radius.

---

## ADR-004: Encrypt secrets at the application level with AES-256-GCM

**Status:** Accepted

**Decision:** Passwords and env values are encrypted in Next.js server code using AES-256-GCM before being saved. Only the ciphertext is stored in the database.

**Reason:** A database leak, a misconfigured RLS policy or a leaked database backup should not expose plaintext secrets. GCM provides both encryption and tamper detection.

**Consequence:**
- Secrets cannot be searched or filtered in SQL.
- Every encryption uses a fresh random IV.
- We never write custom cryptography. All crypto goes through `lib/crypto.ts`.

---

## ADR-005: Keep the encryption master key outside the database

**Status:** Accepted

**Decision:** `MASTER_KEY` lives only in server-side environment variables on the host (and in a secure offline backup). It never has a `NEXT_PUBLIC_` prefix and is never stored in Supabase.

**Reason:** If the key sat next to the encrypted data, encryption would give no protection.

**Consequence:** If the key is lost, all stored secrets are unrecoverable, so a secure backup is mandatory. Key rotation is a planned future task, not part of the MVP.

---

## ADR-006: Do not use Supabase Edge Functions for encryption

**Status:** Accepted

**Decision:** Encryption and decryption run in Next.js Server Actions, not in Supabase Edge Functions.

**Reason:** Next.js already provides a trusted server environment. Adding Edge Functions would add a second runtime, a second place for the master key and more complexity with no benefit.

**Consequence:** The master key exists in only one place (the Next.js host).

---

## ADR-007: Decrypt only on explicit user action

**Status:** Accepted

**Decision:** Secrets are never decrypted during page rendering. A secret is decrypted only when the user clicks Reveal or Copy, through a Server Action.

**Reason:** Decrypting during render would put secrets into page HTML, props, caches and logs. On-demand decryption limits exposure and creates a clear audit event.

**Consequence:** List queries never include encrypted or decrypted secret columns. A reveal request needs one extra round trip.

---

## ADR-008: Enforce access in two layers (server checks and RLS)

**Status:** Accepted

**Decision:** Authorization is checked in Server Actions (`requireRole()`) and again by Row Level Security policies in PostgreSQL.

**Reason:** Server checks give good error messages and business logic. RLS is the safety net if a server check is forgotten or the anon key is abused. Neither layer alone is enough.

**Consequence:** Every table needs RLS policies and tests before merging.

---

## ADR-009: Three roles with project-level access

**Status:** Accepted

**Decision:** Use three roles: Admin, Manager and Developer. Developers see only projects they are assigned to through a `project_members` table.

**Reason:** This matches how the company works and follows least privilege. Offboarding is easy because removing a user or assignment cuts access.

**Consequence:** Custom roles and per-credential permissions are out of scope for the MVP.

---

## ADR-010: Invite-only accounts with mandatory MFA

**Status:** Accepted

**Decision:** Public signup is disabled. Admins invite users. Every user must enroll in TOTP MFA before accessing the dashboard.

**Reason:** The vault holds the keys to every client system. A stolen password alone must not be enough.

**Consequence:** SMTP must be configured for invites. Users need an authenticator app.

---

## ADR-011: Use `@supabase/ssr` with cookie-based sessions

**Status:** Accepted

**Decision:** Use `@supabase/ssr` for authentication in Next.js instead of storing tokens in localStorage.

**Reason:** Cookie-based sessions work correctly with Server Components, Server Actions and middleware, and are safer than tokens in localStorage.

**Consequence:** Authentication must always be verified on the server with `getUser()`, not only by reading the session.

---

## ADR-012: Use the service-role key only for admin tasks

**Status:** Accepted

**Decision:** `SUPABASE_SERVICE_ROLE_KEY` is used only for inviting and managing users, in server-only code. It is never used to read secrets.

**Reason:** The service role bypasses RLS. Limiting it to a few admin functions keeps RLS meaningful for everything else.

**Consequence:** Normal queries always use the user's session client.

---

## ADR-013: Append-only audit log

**Status:** Accepted

**Decision:** Every view, copy, create, update, delete and export of a secret writes to `audit_logs`. The table allows inserts and reads only. No updates or deletes, even for Admins. If the audit write fails, the action fails.

**Reason:** Audit logs are only trustworthy if they cannot be edited, and an access without a record defeats their purpose.

**Consequence:** Log volume will grow, so archival may be needed later.

---

## ADR-014: Separate layers (actions, services, UI)

**Status:** Accepted

**Decision:** Follow the flow `app/` → `actions/` → `services/` → Supabase. UI has no database logic, actions only orchestrate, and services own queries and business logic.

**Reason:** Keeps code testable, prevents security checks from being skipped, and stops AI tools from mixing queries into components.

**Consequence:** Slightly more files, much more predictable code.

---

## ADR-015: Use shadcn/ui and Tailwind CSS for the interface

**Status:** Accepted

**Decision:** Build the UI with shadcn/ui components styled by Tailwind CSS and design tokens defined in `DESIGN.md`.

**Reason:** Accessible components that we own and can modify, fast development and consistent styling.

**Consequence:** No additional UI libraries (such as Material UI or Chakra) will be added.

---

## ADR-016: Validate with Zod and use React Hook Form

**Status:** Accepted

**Decision:** Use Zod schemas for all input validation, shared between forms and server actions. Use React Hook Form for forms.

**Reason:** One schema gives type safety and validation on both client and server. The server always re-validates.

**Consequence:** Every form and server action needs a Zod schema.

---

## ADR-017: Soft-delete clients and projects

**Status:** Accepted

**Decision:** Clients and projects are archived instead of hard-deleted. Individual credentials and env variables can be hard-deleted after confirmation.

**Reason:** Client work history and credential records may be needed after a project ends. Accidental deletion of a whole client would be costly.

**Consequence:** Queries must filter archived records by default.

---

## ADR-018: Manage the schema through migrations only

**Status:** Accepted

**Decision:** All database changes are SQL migration files in `supabase/migrations/`, and types are generated with the Supabase CLI. No manual changes in the dashboard.

**Reason:** Repeatable environments, reviewable changes and no hidden drift between development and production.

**Consequence:** Every schema change goes through a pull request.

---

## ADR-019: Build the web app first, browser extension later

**Status:** Accepted

**Decision:** The MVP is the web app only. The autofill browser extension is a separate Phase 2 project.

**Reason:** A browser extension adds a large security surface and a separate codebase. The web app with copy and open-site buttons covers most daily use.

**Consequence:** The extension must reuse the same Supabase accounts and server-side decryption. It will never store decrypted passwords locally.

---

## ADR-020: Deploy on Vercel with a restricted environment

**Status:** Accepted

**Decision:** Deploy the Next.js app on Vercel (or an equivalent host) with server-only environment variables. Restrict access by VPN or IP allowlist where possible.

**Reason:** Fits the Next.js stack with minimal setup. Network restriction reduces exposure of an internal tool.

**Consequence:** Environment variables and access rules must be reviewed before each production release.

---

## ADR-021: Build a custom vault instead of using an existing tool

**Status:** Accepted (management requirement)

**Decision:** Build a custom internal vault, as requested by management, instead of adopting Vaultwarden, Infisical or HashiCorp Vault.

**Reason:** The company wants a tool organized around clients, projects and environments, using its own stack.

**Consequence:** The team owns security, maintenance and updates. This is a known trade-off, and a mature open-source alternative should be reconsidered if maintenance becomes a burden.

---

## Out of Scope Decisions (Not Doing)

| Item | Reason |
|---|---|
| Zero-knowledge, client-side encryption | Much more complex, especially for team sharing. May be reconsidered later. |
| Separate backend (Express, NestJS) | Not needed (see ADR-002) |
| Supabase Vault / pgsodium for secrets | Keeps one encryption approach under our control (see ADR-004) |
| Custom roles and per-secret permissions | Too complex for the MVP |
| Sharing secrets outside the company | Increases risk with no current need |
| Mobile app | Not needed for the MVP |

---

## How to Add a New Decision

Copy this template to the end of the ADR list:

```
## ADR-XXX: Short title

**Status:** Proposed | Accepted | Superseded by ADR-XXX

**Decision:** What we decided.

**Reason:** Why we decided it.

**Consequence:** Trade-offs and what this means for the code.
```

### Rules
- Never delete an old ADR. Mark it **Superseded** and link the new one.
- Any change to authentication, encryption, RLS, roles or the stack requires a new ADR and team review.
- AI tools must not change an accepted decision on their own. If a task conflicts with an ADR, stop and ask.

---

**Remember: DECISIONS.md = WHY WE CHOSE IT.** `PRD.md` is what and why, `ARCHITECTURE.md` is how it works, `DESIGN.md` is how it looks, `RULES.md` is how to behave, `TASKS.md` is the work plan, and `DECISIONS.md` protects the choices already made.
