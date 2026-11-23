# Security Requirements

Company Vault stores the keys to every client system. A breach here is a breach of every client. Security is built in from the first task, never added before deployment.

Related documents: `ARCHITECTURE.md`, `RULES.md`, `DECISIONS.md`, `TEST_PLAN.md`

**Priority:** if a feature conflicts with a requirement here, the requirement wins.

---

## Security Principles

1. **Least privilege:** users get the minimum access needed for their job.
2. **Defense in depth:** every protection has a backup (server checks and RLS, encryption and access control).
3. **Secure by default:** secrets are hidden, routes are private, access is denied unless allowed.
4. **Nothing sensitive in the browser:** secrets exist in the client only briefly, after an explicit user action.
5. **Everything is accountable:** every sensitive action is logged.
6. **Assume mistakes happen:** design so one bug does not expose everything.

---

## Assets We Protect

| Asset | Sensitivity | Where it lives |
|---|---|---|
| Client credentials (passwords) | Critical | Database, encrypted |
| Environment variables and API keys | Critical | Database, encrypted |
| `MASTER_KEY` | Critical | Host environment variables and offline backup only |
| `SUPABASE_SERVICE_ROLE_KEY` | Critical | Host environment variables only |
| User accounts and MFA secrets | High | Supabase Auth |
| Client details and contacts | Medium | Database |
| Audit logs | High (integrity) | Database, append-only |

---

## Authentication

- Private routes require authentication, enforced in middleware and again in every server action and route handler.
- Verify the user server-side with `supabase.auth.getUser()`. Never trust a cookie or session object alone.
- Public signup is disabled. Accounts are created by Admin invitation only.
- MFA (TOTP) is mandatory for every user. A password alone must never grant access to data.
- Passwords follow a strong policy: minimum 12 characters, checked against common passwords where supported.
- Failed logins are rate limited. Error messages are generic and do not reveal whether an email exists.
- Sessions use secure, HTTP-only, SameSite cookies.
- Sessions expire after inactivity. Users are warned before logout.
- Password reset links expire quickly and work only once.
- Deactivated users lose access immediately, including active sessions.
- Authentication tokens are never stored in localStorage and never placed in URLs.

---

## Authorization

- Users can access only the resources their role and assignments allow.
- Roles: Admin, Manager, Developer. Developers see only projects assigned to them.
- Check authorization **server-side** on every action. Hiding a button is not security.
- Check authorization at the **database** too, through Row Level Security.
- Never accept a user ID, role or permission from the client. Read it from the verified session.
- Prevent insecure direct object reference (IDOR): knowing a credential ID or project ID must not grant access. Always check access to the parent project.
- Return "not found" instead of "forbidden" for resources the user should not know exist.
- The last Admin cannot be removed or demoted.
- Role changes and access changes are audit logged.

---

## Secrets Management

### In the application
- Never expose secrets to client-side code.
- Never prefix `MASTER_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.
- Mark crypto and service-role modules with `import "server-only"`.
- Never hardcode secrets in code, tests, comments, seed files or documentation.
- Commit only `.env.example` with placeholders. `.env*` files stay in `.gitignore`.
- Never log secrets, decrypted values, tokens or keys, including in error messages and analytics.

### Production keys
- Store production keys only in the hosting provider's encrypted environment settings.
- Keep a secure offline backup of `MASTER_KEY`, stored separately from the database backups.
- Limit who can view or change production environment variables.
- If a key is exposed (committed, logged, shared), treat it as leaked and rotate it immediately.

---

## Encryption

- Passwords and env values are encrypted with **AES-256-GCM** before they are stored.
- Use a new random 12-byte IV for every encryption. Never reuse IVs.
- Authentication tags must be verified on decryption. Tampered data must fail.
- Use only `lib/crypto.ts`. Never write or copy custom cryptography elsewhere.
- Decrypt only inside server actions, and only on an explicit Reveal, Copy or Export action.
- Never decrypt during page render. Never pass secrets as page props, query strings or cache entries.
- Encrypt anything that could contain a secret, including notes fields intended for secrets.
- All traffic uses HTTPS (TLS 1.2 or higher). Supabase connections use TLS.

### Key management
- `MASTER_KEY` is 32 random bytes generated with a cryptographically secure generator (`openssl rand -hex 32`).
- Plan for key rotation (a re-encryption script with versioned keys). Add a key version prefix to ciphertext so rotation is possible later.
- Losing the key means losing all secrets, so the offline backup is mandatory.

---

## Database

- Row Level Security is enabled on **every** table, with policies written in the same migration that creates the table.
- Default deny: a table without a matching policy returns nothing.
- Test RLS policies with each role's token directly against the database.
- The anon key must never allow reading or writing protected data.
- Use the user's session client for normal queries. Use the service-role client only for admin tasks like inviting users, never to read secrets.
- Use parameterized queries through the Supabase client. Never build SQL from strings.
- The `audit_logs` table allows insert and select only. No update or delete for any role.
- Schema changes go through migration files and pull requests only. No manual changes in production.
- Enable automated backups and Point-in-Time Recovery. Backups contain only encrypted secrets.
- Restrict direct database access. Do not expose the database connection string.

---

## Input Validation

- Validate all user input on the server with Zod, even if the client already validated it.
- Use allow-lists (accepted values and patterns) rather than block-lists.
- Set maximum lengths on every text field.
- Validate URLs: allow only `http` and `https`, and reject `javascript:` and similar schemes.
- Validate enums such as role and environment against fixed lists.
- Env variable keys must match a safe pattern (for example `^[A-Za-z_][A-Za-z0-9_]*$`).
- Escape output rendered into pages. Never use `dangerouslySetInnerHTML` with user data.
- Pasted `.env` text is parsed safely, limited in size, and never logged.
- Return field-level validation messages that do not leak internal details.

---

## APIs, Server Actions and Route Handlers

- Verify authentication and authorization first, before reading the body.
- Validate the request body, parameters and query strings with Zod.
- Server actions return typed results and generic error messages. Never return stack traces, SQL errors or secrets.
- Use correct HTTP methods and reject unexpected ones.
- Apply rate limits to login, MFA verification, reveal, export and invite actions.
- Protect state-changing requests against CSRF (Next.js Server Actions provide origin checks. Keep them enabled and use SameSite cookies).
- Set strict CORS. Allow only our own origin. The future browser extension origin is added explicitly.
- Limit request body size.
- Webhooks, if ever added, must verify signatures.

---

## Reveal, Copy and Export Controls

These are the highest-risk actions and have extra rules:

- Allowed only after a fresh server-side access check for the specific project.
- Rate limited per user, with alerts for unusual volume.
- Write an audit log entry **before** returning the value. If logging fails, no secret is returned.
- Responses containing secrets use `Cache-Control: no-store`.
- Revealed values auto-hide after 15 seconds in the UI.
- Clipboard is cleared 30 seconds after copying.
- The masked display does not reveal the password length.
- Export produces a file only for env variables the user can access. Large exports are flagged in the audit log.

---

## File Uploads (Phase 2)

File attachments are not part of the MVP. When added, validate:

- **File type:** allow-list of types (PDF, PNG, JPG, TXT). Check the real content type, not only the extension.
- **File size:** maximum 5 MB per file and a per-project limit.
- **Filename:** sanitize, remove path characters, and generate a random storage name. Never use the user's filename as a path.
- Use private Supabase Storage buckets only, with RLS policies matching project access.
- Serve files through short-lived signed URLs.
- Never execute or render uploaded files inline. Force download with safe headers.
- Scan for malware if the volume or risk grows.
- Never store secrets in file names or metadata.

---

## Logging and Monitoring

### Audit logs
- Log view, copy, reveal, create, update, delete and export of secrets.
- Log login, failed login, MFA events, invites, role changes and deactivations.
- Each entry records user, action, target, project, IP address and timestamp.
- Never include secret values or decrypted data in any log.

### Monitoring and alerts
- Alert on repeated failed logins, many reveals in a short time, access outside normal hours or unusual locations, and failed audit writes.
- Review audit logs regularly (at least monthly).
- Application logs must be scrubbed of secrets. Review them for leaks during testing.

---

## Web Security Headers and Browser Protections

- `Strict-Transport-Security` (HSTS) with a long max-age
- `Content-Security-Policy` that blocks inline scripts and unknown origins
- `X-Frame-Options: DENY` (or `frame-ancestors 'none'`) to prevent clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting unused browser features
- `Cache-Control: no-store` on pages and responses containing secrets
- Secrets fields use `autocomplete="off"` where appropriate and are not selectable while hidden
- HTTPS only. Redirect all HTTP traffic.

---

## Dependencies and Supply Chain

- Keep dependencies minimal. Prefer what the stack already provides.
- Commit the lockfile. Use `npm ci` in CI and deployments.
- Run `npm audit` on every release. Fix high and critical issues before merging.
- Do not install unmaintained or very low-download packages.
- Review new dependencies before adding them.
- Enable automated dependency alerts (Dependabot or equivalent).
- Pin the Node.js version.

---

## Infrastructure and Deployment

- The vault uses its own Supabase project, never shared with any client project or other app (see ADR-003).
- Host with HTTPS and restrict access by VPN or IP allowlist where possible.
- Production environment variables are set in the host dashboard and reviewed before each release.
- Separate development, staging and production environments with different keys. Never use production secrets in development.
- Enable two-factor authentication on the Supabase, Vercel and GitHub accounts of every team member.
- Protect the `main` branch: pull requests required, reviews required for security-critical code, no direct pushes.
- Limit who has Admin access to hosting and Supabase to the minimum.

---

## Backup and Recovery

- Automated daily backups plus Point-in-Time Recovery enabled in Supabase.
- Backups hold only encrypted secrets, so they are useless without `MASTER_KEY`.
- Store the `MASTER_KEY` backup offline, in a different location from database backups, with at least two trusted people who know where it is.
- Test a full restore, including decrypting a sample secret, before launch and every quarter.
- Document recovery steps.

---

## Offboarding

When someone leaves the team:

1. Deactivate their vault account immediately.
2. Remove their MFA device and active sessions.
3. Generate a report of every project they could access.
4. Rotate high-risk credentials they could see (production keys first).
5. Review their audit log for unusual activity.
6. Remove them from GitHub, Supabase, Vercel and other services.

---

## Incident Response

If a leak or breach is suspected:

1. **Contain:** deactivate affected accounts, revoke sessions, and restrict access.
2. **Assess:** check audit logs to see what was accessed, by whom and when.
3. **Rotate:** change `MASTER_KEY` and every exposed client credential. If the key was exposed, re-encrypt all secrets with a new key.
4. **Notify:** inform the manager and, where required, the affected clients.
5. **Fix:** find the root cause and patch it.
6. **Record:** write a short incident report and update this file and `DECISIONS.md` if needed.

Keep a short list of who to contact and who has authority to act. Add names to `MEMORY.md` or the team's private notes, not to this file.

---

## Security Review Checklist (Every Pull Request)

For any change touching auth, roles, crypto, RLS, secrets or logging, a second person must review:

- [ ] Authentication is checked server-side
- [ ] Authorization is checked for the specific resource (no IDOR)
- [ ] RLS exists and is tested for any new or changed table
- [ ] Input is validated with Zod on the server
- [ ] No secrets are logged, returned in lists, placed in props or hardcoded
- [ ] Secrets are encrypted before storage and decrypted only on explicit action
- [ ] Sensitive actions write audit logs
- [ ] Error messages are generic
- [ ] No new dependency without review
- [ ] No `NEXT_PUBLIC_` variable holds a secret
- [ ] Tests cover the security behavior

---

## Known Risks and Accepted Trade-offs

| Risk | Mitigation | Status |
|---|---|---|
| Authorized user copies secrets and misuses them | Audit logs, alerts, offboarding process | Accepted, cannot be fully prevented |
| `MASTER_KEY` lost | Offline backup in a separate location | Must be set up before launch |
| `MASTER_KEY` stolen from the host | Limit host access, 2FA, key rotation plan | Mitigated |
| Server-side compromise exposes keys in memory | Hardened host, minimal dependencies, monitoring | Accepted (no zero-knowledge design, see `DECISIONS.md`) |
| Phishing of team members | Mandatory MFA, training, domain matching in future extension | Mitigated |
| Compromised developer laptop | Auto-hide, clipboard clearing, offboarding steps | Partly mitigated |
| Supabase outage or incident | Backups, tested restore plan | Accepted |

---

## Security Schedule

| When | Task |
|---|---|
| Every pull request | Security review checklist |
| Every release | `npm audit`, full 🔒 section of `TEST_PLAN.md` |
| Monthly | Review audit logs and user list, remove unused accounts |
| Quarterly | Test backup restore, review RLS policies, review access of all users |
| Yearly | Consider an external security review or penetration test |
| On any departure | Offboarding steps |

---

## 15. Client Share Links Security Controls

- **Dual-Factor Sharing:** Links combine a 256-bit unguessable URL token (`crypto.randomBytes(32)`) with a 6-digit numeric PIN.
- **PIN Protection:** PINs are stored as salted `scrypt` hashes with a server-side pepper (`SHARE_PIN_PEPPER`). Timing-safe equality checks are enforced via `crypto.timingSafeEqual`.
- **Brute-Force Lockout:** 5 failed PIN attempts lock the link for 30 minutes. 10 failed attempts per hour per IP blocks attempts across links.
- **Tightly Scoped Service-Role Access (ADR-023):** `share-access.service.ts` is the single authorized module allowed to query secrets for unauthenticated client sessions. It strictly validates that requested items exist within `share_link_items` for that specific active, unexpired, unrevoked share link.
- **Session Security:** 20-minute sliding HMAC-SHA256 session cookie (`SHARE_SESSION_SECRET`) with `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/share`. Full link status and item membership are re-evaluated on every server action.
- **Immutable Audit Trail:** All client access attempts, failures, and secret reveals write to `audit_logs` before any decrypted value is released.

---

## What Must Never Happen

- A secret appears in page HTML, a URL, logs, an error message or the browser bundle
- A user reads data outside their role or assigned projects
- A table exists without RLS
- A reveal, copy or export happens without an audit log
- `MASTER_KEY` or the service-role key reaches the client
- Plaintext secrets are stored in the database or in backups
- Real client credentials are used in tests, seed data, documentation or screenshots

If any of these happen, treat it as a security incident.

---

**Remember: security is not a final step.** Every task in `TASKS.md` follows these requirements from day one, and every release is checked against `TEST_PLAN.md`.
