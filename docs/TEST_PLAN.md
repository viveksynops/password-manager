# Test Plan

This file defines what "working" means for Company Vault. Use it as the testing checklist for every task and before every release.

Related documents: `PRD.md` (success criteria), `RULES.md` (testing rules), `TASKS.md` (work plan)

**Test accounts needed (use fake data only):**

| Account | Role | Assigned projects |
|---|---|---|
| admin@test.local | Admin | All |
| manager@test.local | Manager | All |
| dev-a@test.local | Developer | Project A only |
| dev-b@test.local | Developer | Project B only |
| inactive@test.local | Developer (deactivated) | None |

**Test data rule:** never use real client passwords, keys or data in tests. Use clearly fake values such as `FAKE_PASSWORD_123` and `FAKE_API_KEY_abc`.

**Priority legend:** 🔒 = security-critical (must pass before any release)

---

## 1. Authentication

- [ ] Invited user can accept the invite and set a password
- [ ] User can log in with valid email and password
- [ ] Invalid password shows a generic error (does not reveal whether the email exists)
- [ ] Unknown email shows the same generic error
- [ ] 🔒 Public signup is not possible (no signup page, direct API signup rejected)
- [ ] 🔒 Logged-out user cannot access any dashboard page (redirected to login)
- [ ] 🔒 Logged-out user cannot call any server action or API route
- [ ] User can log out and cannot return to dashboard with the back button
- [ ] Forgot password sends a reset email and the new password works
- [ ] Session expires after inactivity and shows a notice before logout
- [ ] 🔒 Repeated failed logins are rate limited
- [ ] Login works on mobile and desktop

---

## 2. Multi-Factor Authentication (MFA)

- [ ] 🔒 New user is forced to enroll in MFA at first login
- [ ] QR code and manual key both work with an authenticator app
- [ ] 🔒 Correct code allows access to the dashboard
- [ ] 🔒 Wrong code is rejected and does not grant access
- [ ] 🔒 Expired code is rejected
- [ ] 🔒 User with password only (no MFA step) cannot reach any dashboard page
- [ ] 🔒 User with password only cannot call server actions

---

## 3. Team Management (Admin)

- [ ] Admin can view the team list
- [ ] Admin can invite a new user with a role
- [ ] Admin can change a user's role
- [ ] Admin can deactivate a user
- [ ] 🔒 Deactivated user is logged out and cannot log in again
- [ ] 🔒 Deactivated user's existing session cannot read data
- [ ] 🔒 Manager cannot access the team page
- [ ] 🔒 Developer cannot access the team page
- [ ] 🔒 Non-admin cannot call invite or role-change actions directly
- [ ] Last remaining Admin cannot be deactivated or demoted

---

## 4. Clients

- [ ] Admin and Manager can create a client
- [ ] Required fields are validated with clear messages
- [ ] Admin and Manager can edit a client
- [ ] Admin and Manager can archive a client
- [ ] Archived clients are hidden by default
- [ ] Client list supports search and pagination
- [ ] Client detail page shows its projects
- [ ] 🔒 Developer cannot create, edit or archive a client
- [ ] 🔒 Developer cannot see clients with no assigned projects
- [ ] Empty state shows when there are no clients
- [ ] Loading skeleton shows while data loads
- [ ] Error state with retry shows when loading fails

---

## 5. Projects

- [ ] Admin and Manager can create a project under a client
- [ ] Admin and Manager can edit and archive a project
- [ ] Admin and Manager can assign and remove team members
- [ ] 🔒 Developer sees only projects assigned to them
- [ ] 🔒 Developer opening another project's URL gets "not found" or "no access"
- [ ] 🔒 Removing a developer from a project removes access immediately
- [ ] 🔒 Developer cannot create, edit or archive projects
- [ ] Project page shows tabs: Credentials and Env Variables
- [ ] Empty, loading and error states work

---

## 6. Credentials Vault

### Create, edit, delete
- [ ] User with access can add a credential (service, URL, username, password, notes)
- [ ] Required fields and URL format are validated
- [ ] User can edit a credential
- [ ] Leaving the password blank on edit keeps the old password
- [ ] User can delete a credential after confirming
- [ ] Delete dialog states exactly what will be deleted

### Secret handling
- [ ] 🔒 Password is stored encrypted in the database (not readable as plain text)
- [ ] 🔒 The credentials list response does not contain any password data
- [ ] 🔒 Password is not present in page HTML, props, network responses for list pages or URLs
- [ ] 🔒 Password is masked by default on page load
- [ ] Reveal shows a loading state, then the value
- [ ] Revealed value hides again after 15 seconds
- [ ] Copy copies the correct value and shows a "Copied" toast
- [ ] Clipboard is cleared after 30 seconds
- [ ] Masked length does not match the real password length
- [ ] "Open site" opens the login URL in a new tab
- [ ] Password generator creates strong passwords of the chosen length

### Access
- [ ] 🔒 Assigned developer can reveal and copy
- [ ] 🔒 Unassigned developer cannot reveal (server action rejects, even with a known credential ID)
- [ ] 🔒 Logged-out request to the reveal action is rejected
- [ ] 🔒 Deactivated user cannot reveal

### States
- [ ] Empty state shows when there are no credentials
- [ ] Loading and error states work

---

## 7. Environment Variables

- [ ] User can add a variable (key and value) to Dev, Staging or Production
- [ ] Environment switcher shows the correct variables for each environment
- [ ] Environment badges show the correct colors (Dev blue, Staging amber, Production red)
- [ ] User can edit and delete a variable
- [ ] Production delete requires typing the project name
- [ ] Duplicate keys in the same environment are rejected
- [ ] Invalid key names are rejected
- [ ] 🔒 Values are stored encrypted
- [ ] 🔒 Values are masked by default and not included in list data
- [ ] Reveal and copy work with the same timers as credentials

### Paste .env import
- [ ] Valid `.env` text shows a preview before saving
- [ ] Comments and blank lines are ignored
- [ ] Quoted values are parsed correctly
- [ ] Values containing `=` are parsed correctly
- [ ] Empty values are handled
- [ ] Duplicate keys in pasted text are flagged
- [ ] Importing into an environment with existing keys asks whether to overwrite or skip
- [ ] 🔒 Pasted text is not logged or stored anywhere except the encrypted result

### Export .env
- [ ] Export downloads a correct `.env` file for the selected environment
- [ ] 🔒 Export is allowed only for users with project access
- [ ] 🔒 Export writes an audit log entry

---

## 8. Roles and Permissions Matrix

Expected results. Each cell must be tested.

| Action | Admin | Manager | Developer (assigned) | Developer (not assigned) |
|---|---|---|---|---|
| View team page | Yes | No | No | No |
| Invite or deactivate users | Yes | No | No | No |
| View audit logs | Yes | No | No | No |
| Create or edit clients | Yes | Yes | No | No |
| Create or edit projects | Yes | Yes | No | No |
| Assign members to project | Yes | Yes | No | No |
| View project | Yes | Yes | Yes | No |
| Add or edit credentials | Yes | Yes | Yes | No |
| Reveal or copy secrets | Yes | Yes | Yes | No |
| Add or edit env variables | Yes | Yes | Yes | No |
| Delete credentials or env variables | Yes | Yes | Decide in review | No |

Note: confirm with the team whether Developers may delete secrets, then update this table and `PRD.md`.

---

## 9. Audit Logs

- [ ] 🔒 Creating a credential writes a log entry
- [ ] 🔒 Editing a credential writes a log entry
- [ ] 🔒 Deleting a credential writes a log entry
- [ ] 🔒 Revealing a secret writes a log entry
- [ ] 🔒 Copying a secret writes a log entry
- [ ] 🔒 Env variable create, edit, delete, reveal, copy and export write log entries
- [ ] 🔒 Each entry shows who, what, which project and when
- [ ] 🔒 Log entries never contain secret values
- [ ] 🔒 Audit log entries cannot be edited or deleted by any role (including Admin and direct API calls)
- [ ] 🔒 If the audit write fails, the action fails and no secret is returned
- [ ] Admin can filter by user, action, project and date range
- [ ] Pagination works
- [ ] 🔒 Non-admin cannot view audit logs

---

## 10. Search

- [ ] Global search finds clients, projects and services
- [ ] Cmd or Ctrl + K opens search
- [ ] 🔒 Search results include only items the user can access
- [ ] 🔒 Search never returns secret values
- [ ] No results shows a friendly empty state

---

## 11. Row Level Security (Database)

Test directly against the database with each user's token, not only through the UI.

- [ ] 🔒 RLS is enabled on every table
- [ ] 🔒 Anonymous (not logged in) requests return no data on every table
- [ ] 🔒 Developer A cannot select, insert, update or delete Project B data
- [ ] 🔒 Developer cannot read `profiles` of other users beyond what is needed
- [ ] 🔒 Only Admin can read audit logs
- [ ] 🔒 No role can update or delete audit logs
- [ ] 🔒 The anon key alone cannot read or write any protected data
- [ ] 🔒 The service-role key is not present in any browser bundle

---

## 12. Encryption (Unit Tests)

- [ ] 🔒 Encrypt then decrypt returns the original text
- [ ] 🔒 Encrypting the same text twice gives different outputs (unique IV)
- [ ] 🔒 Modified ciphertext fails to decrypt (tamper detection)
- [ ] 🔒 Decrypting with the wrong key fails
- [ ] 🔒 Empty string, long string and Unicode text work correctly
- [ ] 🔒 Missing or invalid `MASTER_KEY` fails safely at startup

---

## 13. Security Checks

- [ ] 🔒 Search the repository: no real secrets committed
- [ ] 🔒 `.env.local` is in `.gitignore`
- [ ] 🔒 `MASTER_KEY` and `SUPABASE_SERVICE_ROLE_KEY` do not appear in the browser bundle (search built files)
- [ ] 🔒 No secrets appear in server logs or error responses
- [ ] 🔒 Error responses show generic messages (no stack traces or SQL errors)
- [ ] 🔒 Security headers are present (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- [ ] 🔒 Site is served over HTTPS only
- [ ] 🔒 Server actions reject requests with missing or invalid sessions
- [ ] 🔒 Rate limits apply to login and reveal actions
- [ ] 🔒 Inputs containing script tags or SQL-like text are handled safely (no XSS or injection)
- [ ] 🔒 `npm audit` shows no high or critical issues

---

## 14. Responsive

Test every page at these sizes:

| Width | Device |
|---|---|
| 360px | Small phone |
| 375px | Phone |
| 768px | Tablet |
| 1024px | Small laptop |
| 1440px | Desktop |

Check on each size:

- [ ] No horizontal page scroll
- [ ] Sidebar becomes a slide-in menu on mobile
- [ ] Tables scroll inside their container or become stacked cards
- [ ] Buttons and icons are at least 44px touch targets on mobile
- [ ] Dialogs fit the screen and are scrollable
- [ ] `SecretField` reveal and copy buttons are usable on touch
- [ ] Text is readable without zooming

---

## 15. Accessibility

- [ ] All pages can be used with keyboard only
- [ ] Focus ring is visible on every interactive element
- [ ] Every form field has a visible label
- [ ] Error messages are announced to screen readers
- [ ] Icon-only buttons have an `aria-label`
- [ ] Dialogs trap focus and close with Escape
- [ ] Color contrast meets WCAG AA in light and dark mode
- [ ] Status is never conveyed by color alone
- [ ] Respects `prefers-reduced-motion`

---

## 16. UI States

For every list and form, confirm:

- [ ] Loading state (skeleton or spinner)
- [ ] Empty state (icon, message, call-to-action)
- [ ] Error state (friendly message and retry)
- [ ] Success feedback (toast)
- [ ] Buttons disabled with a spinner while submitting
- [ ] No double submit on rapid clicks
- [ ] Dark mode looks correct

---

## 17. Browser Compatibility

Test the main flow (login, view project, reveal, copy) on:

- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## 18. Performance

- [ ] Dashboard loads in under 2 seconds on a normal connection
- [ ] Lists with 500+ items remain responsive (pagination works)
- [ ] Reveal returns in under 1 second
- [ ] Search results appear in under 500ms
- [ ] Lighthouse performance score is 80 or higher

---

## 19. End-to-End Scenarios (PRD Success Criteria)

Run these full flows with fake data before release:

- [ ] **E2E-01:** Admin invites a developer, who accepts, sets up MFA and logs in
- [ ] **E2E-02:** Manager creates a client "Acme Corp" and project "Ecommerce Platform"
- [ ] **E2E-03:** Manager saves a Supabase login and a Cloudinary login for the project
- [ ] **E2E-04:** Manager pastes a `.env` file and sees all keys under the correct environment
- [ ] **E2E-05:** Manager assigns the developer to the project
- [ ] **E2E-06:** Developer reveals and copies a password, and it hides again afterward
- [ ] **E2E-07:** Developer cannot see or open any other project
- [ ] **E2E-08:** Admin sees every reveal and copy in the audit log
- [ ] **E2E-09:** Admin deactivates the developer, who loses access immediately
- [ ] **E2E-10:** User finds a credential within seconds using search
- [ ] **E2E-11:** Developer exports `.env` for the project and the file is correct

---

## 20. Backup and Recovery

- [ ] Database backup runs and a restore test succeeds
- [ ] Restored data decrypts correctly with the stored `MASTER_KEY`
- [ ] Offline backup of `MASTER_KEY` exists and is stored separately
- [ ] Team knows the recovery steps

---

## 21. Pre-Release Checklist

All of these must be true before going live:

- [ ] Every 🔒 item above passes
- [ ] All E2E scenarios pass
- [ ] Roles matrix verified for every cell
- [ ] RLS tests pass against the production-like database
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run test` and `npm run build` all pass
- [ ] No unresolved high-severity issues in `MEMORY.md`
- [ ] Production environment variables are set and correct
- [ ] MFA is enforced and public signup is off
- [ ] Backups are enabled
- [ ] A teammate has reviewed all security-critical code

---

## Test Types and Tools

| Type | Tool | Covers |
|---|---|---|
| Unit | Vitest | crypto, env parser, Zod schemas, utilities |
| Component | React Testing Library | `SecretField`, forms, empty and error states |
| Integration | Vitest with local Supabase | services, RLS policies, audit logs |
| End-to-end | Playwright | full user flows, roles, responsive sizes |
| Accessibility | axe (via Playwright) | WCAG checks |
| Performance | Lighthouse | speed and best practices |
| Manual | This checklist | final review before release |

---

## Bug Report Template

```
**Title:**
**Found in:** TASK-XXX or page
**Severity:** low | medium | high | critical (security)
**Steps to reproduce:**
1.
2.
**Expected result:**
**Actual result:**
**Role / browser / screen size:**
```

Security bugs (secret exposed, access bypass) are always **critical** and block release.

---

**Remember: TEST_PLAN.md = WHAT "WORKING" MEANS.** If an item here does not pass, the feature is not done.
