# Product Requirements Document

## Product
**Company Vault**: an internal password and secrets manager for client projects.

---

## Problem
Our team builds websites and apps for many clients. For every project we create accounts and keys on third-party services (Supabase, Cloudinary, Vercel, domain providers, payment gateways, etc.) and we hold client details.

Today this information is scattered across chats, emails, notes and personal files. This causes:

- Credentials getting lost or hard to find
- Passwords shared insecurely over chat or email
- No record of who accessed what
- No quick way to remove a former employee's access
- Time wasted asking teammates for logins and `.env` values

---

## Target Users

| User | Needs |
|---|---|
| **Admin** (manager / owner) | Full control, add or remove team members, see audit logs |
| **Manager** | Create clients and projects, assign developers |
| **Developer** | View and copy credentials and env keys for assigned projects only |

---

## Goal
Create one secure, central place where the team stores and retrieves all client project credentials, environment variables and client details, with controlled access and a record of every action.

---

## Core Features

1. **Authentication and Team Access**
2. **Client Management**
3. **Project Management**
4. **Credentials Vault**
5. **Environment Variables Manager**
6. **Role-Based Access Control**
7. **Audit Logs**
8. **Search and Productivity Tools**

---

## Feature Details

### 1. Authentication and Team Access
- Login with email and password
- Multi-factor authentication (MFA)
- Invite-only accounts (no public signup)
- Admin can deactivate a user instantly

### 2. Client Management
- Add, edit and archive clients
- Store client name, contact person, email, phone and notes
- View all projects of a client in one place

### 3. Project Management
- Create projects under a client (e.g. "Ecommerce Platform")
- Store live URL, repo link, hosting info and tech stack
- Assign team members to a project

### 4. Credentials Vault
- Save service logins per project (service name, login URL, email/username, password, notes)
- Passwords hidden by default, with reveal and copy actions
- Clipboard clears automatically after a short time
- Built-in strong password generator

### 5. Environment Variables Manager
- Store key-value pairs grouped by environment (dev, staging, production)
- Paste a full `.env` file to import many keys at once
- Export keys back to a `.env` file
- Values hidden by default

### 6. Role-Based Access Control
- Admin, Manager and Developer roles
- Developers see only the projects assigned to them
- Access changes apply immediately

### 7. Audit Logs
- Record every view, copy, create, edit and delete of sensitive data
- Each entry shows who, what, which project and when
- Only Admins can view the logs

### 8. Search and Productivity
- Global search across clients, projects and services
- Tags and favorites
- Custom fields (API key, license key, database URL, etc.)

---

## MVP (Phase 1)
- Login with MFA
- Admin invites team members
- Create, edit and archive clients
- Create, edit and archive projects
- Add, edit and delete credentials
- Reveal and copy passwords
- Add, edit and delete env variables per environment
- Import and export `.env`
- Admin, Manager and Developer roles
- Project-level access for developers
- Basic audit log
- Global search

---

## Phase 2 (Later)
- Browser extension to autofill logins on sites like Cloudinary
- Version history of secrets with rollback
- Expiry reminders for API keys and domain renewals
- Offboarding report (everything a leaving employee could access)
- File attachments per project
- Project templates (e.g. standard ecommerce service checklist)
- Email or Slack alerts for suspicious activity

---

## In Scope (Feature Addition)
- Client share links with PIN protection, expiration, and granular secret selection (see `docs/FEATURE_CLIENT_SHARE.md`)

---

## Out of Scope
- Direct client login accounts or client editing
- Mobile app
- Payments or billing
- Automatic password rotation
- Replacing client-side secret managers (e.g. Vercel env settings)

---

## Security Requirements (Non-Negotiable)
- All passwords and env values are stored encrypted, never as plain text
- Secrets are only decrypted when a user explicitly reveals or copies them
- Users can never access data outside their role and assigned projects
- All access is over HTTPS
- Secrets never appear in logs or error messages
- The vault runs on its own separate backend, not shared with any client project
- Regular encrypted backups

---

## Success Criteria
A user should be able to:

1. Log in with email, password and MFA
2. Admin invites a new team member and assigns a role
3. Create a client and a project under it
4. Save a Supabase login and a Cloudinary login for that project
5. Paste a `.env` file and see all keys saved under the right environment
6. Reveal and copy a password, and see it hidden again afterward
7. Confirm a developer cannot see projects they are not assigned to
8. Admin sees every reveal and copy in the audit log
9. Admin removes a user and that user loses access immediately
10. Find any credential within seconds using search

---

## Tech Stack
Next.js, Supabase, shadcn/ui, Tailwind CSS

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Vault data leak | Exposes all client systems | Encryption, strict access rules, MFA, separate backend |
| Lost encryption key | All secrets unrecoverable | Store key backup securely in a separate location |
| Employee leaves with access | Credentials misused | Instant deactivation, offboarding report, rotate keys |
| Team keeps using chat and notes | Tool adoption fails | Make it fast and easy to use daily |

---

## Timeline (Estimate)

| Week | Focus |
|---|---|
| 1 | Auth, roles, clients, projects |
| 2 | Credentials vault and encryption |
| 3 | Env manager, audit logs |
| 4 | Search, testing, deployment |
| 5+ | Phase 2 (browser extension and more) |

---

**Remember: PRD = WHAT + WHY.** The technical *how* (database schema, encryption code, folder structure) goes in a separate technical design document.
