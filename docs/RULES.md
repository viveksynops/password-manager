# Development Rules

These rules apply to every developer and every AI coding tool working on Company Vault. This app stores client credentials and secrets, so security rules are never optional.

Project documents:
- `PRD.md`: what we are building and why
- `ARCHITECTURE.md`: how the system works
- `DESIGN.md`: how it should look and feel

If a rule here conflicts with a request, follow the rule and ask for clarification.

---

## General

- Use TypeScript with `strict` mode. Never use `any`.
- Reuse existing components, services and utilities.
- Do not duplicate logic. Extract shared code instead.
- Keep functions small and single-purpose.
- Keep files focused. Split any file over ~300 lines.
- Do not modify unrelated files.
- Do not add new dependencies without a clear reason. Prefer what the stack already provides (Next.js, Supabase, shadcn/ui, Tailwind, Zod, React Hook Form).
- Use clear, descriptive names. No abbreviations like `usr`, `cred2`, `tmp`.
- Remove unused code, console logs and commented-out code before committing.
- Do not leave TODOs without a ticket or note explaining why.

### Naming conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `SecretField.tsx` |
| Files (non-component) | kebab-case or dot notation | `credential.service.ts` |
| Functions, variables | camelCase | `getProjectCredentials` |
| Constants | UPPER_SNAKE_CASE | `CLIPBOARD_CLEAR_MS` |
| Types, interfaces | PascalCase | `Credential`, `ProjectRole` |
| Database tables, columns | snake_case | `env_variables`, `created_at` |

---

## Before Coding

- Read `PRD.md`, `ARCHITECTURE.md` and `DESIGN.md` relevant to the task.
- Inspect the existing implementation before writing new code.
- Search for existing components, services or helpers that already do the job.
- Make a short plan for any change touching more than 3 files.
- Confirm the feature is inside the MVP scope in `PRD.md`. Do not build "Out of Scope" items.
- Ask when requirements are unclear instead of guessing, especially for anything involving permissions or secrets.

---

## Architecture

- Follow the layers in `ARCHITECTURE.md`: `app/` → `actions/` → `services/` → Supabase.
- UI components must not contain database logic.
- Database operations belong only in `services/`.
- Server actions only orchestrate: verify auth, validate input, call a service, return a result.
- Business logic stays out of components.
- Generic reusable UI goes in `components/`. Feature-specific UI goes in `features/`.
- Use `import "server-only"` in modules that handle crypto, service-role access or secrets.
- All schema changes go through migration files in `supabase/migrations/`. Never edit the database manually.
- Use generated Supabase types from `types/database.types.ts`.

---

## UI

- **Mandatory shadcn Component Rule**: ALWAYS check shadcn for any required UI component. Never build custom components from scratch if shadcn has one (sidebar, breadcrumb, avatar, table, dialog, alert-dialog, sheet, dropdown-menu, form, etc.). If it is not installed, install it using `npx shadcn add <component>` and use it.
- Follow `DESIGN.md` for colors, typography, spacing, radius and components.
- Use shadcn/ui components and CSS variables. Do not hardcode colors or create one-off styles.
- Do not edit `src/components/ui/*` components directly. Treat them as unedited primitives from shadcn; compose and style them via props and wrapper components.
- Keep page files lean (< 25 lines). Defer all rendering and UI logic to reusable components in `features/` or `components/`.
- Use Tailwind utility classes. No inline styles, no separate CSS files for components.
- Use lucide-react for icons.
- Maintain responsive design from 360px upward.
- Include **loading states** (skeletons, button spinners).
- Include **empty states** with a call to action.
- Include **error states** with a retry option.
- Forms must have labels, inline validation messages and keyboard support.
- Every icon-only button needs an `aria-label`.
- Use the shared `SecretField` component for every password, key or secret value. Never render secrets any other way.
- Destructive actions require a confirmation dialog.
- Prefer Server Components. Use `"use client"` only when interactivity is needed.

---

## Security (Critical)

### Secrets and keys
- Never expose API keys, the `MASTER_KEY` or the `SUPABASE_SERVICE_ROLE_KEY`.
- Never prefix `MASTER_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.
- Never commit `.env` files. Keep `.env.example` with placeholder values only.
- Never hardcode secrets, passwords or test credentials in code, tests, comments or seed files.
- Never log secrets, decrypted values, tokens or encryption keys. This includes `console.log`, error messages and analytics.
- Never return stack traces or raw database errors to the client.

### Encryption
- Passwords and env values must be encrypted (AES-256-GCM) **before** being saved.
- Use a fresh random IV for every encryption. Never reuse IVs.
- Decrypt only inside server actions, and only when the user explicitly clicks Reveal or Copy.
- Never decrypt in Server Components. Never pass secrets as page props or put them in URLs.
- Never write custom cryptography. Use `lib/crypto.ts` only.

### Authentication and authorization
- Verify authentication server-side in every server action and route handler.
- Verify the user's role and project access server-side. Never trust the client.
- Use `getCurrentUser()` and `requireRole()` from `lib/auth.ts`.
- Every database table must have RLS enabled with tested policies. A table without RLS must not be merged.
- Use the service-role client only for admin tasks (such as inviting users). Never use it to read secrets.
- Public signup stays disabled.

### Input and output
- Validate all input with Zod on the server, even if the client already validated it.
- Use parameterized queries through the Supabase client. Never build SQL from strings.
- Escape or sanitize anything rendered back to the page.

### Audit logging
- Every view, copy, create, update and delete of a secret must write an audit log entry.
- Audit logs are append-only. Never add update or delete operations for them.
- If the audit write fails, the operation fails.

### Dependencies
- Run `npm audit` before releases.
- Do not install packages that are unmaintained or have very few downloads.

---

## Database

- Use snake_case for tables and columns.
- Every table has `id` (UUID), `created_at` and `updated_at`.
- Every table has RLS enabled. Write policies in the same migration that creates the table.
- Use foreign keys with sensible `ON DELETE` behavior.
- Soft-delete (archive) clients and projects instead of hard-deleting them.
- Never store plaintext secrets in any column, including notes fields intended for secrets. Encrypt them as well.
- Regenerate `database.types.ts` after every migration.

---

## Error Handling

- Handle errors explicitly. Never swallow them with empty `catch` blocks.
- Server actions return a typed result such as `{ success: true, data }` or `{ success: false, error }`.
- Error messages shown to users are short, friendly and contain no sensitive details.
- Log technical details server-side without including secret values.

---

## Testing

- Add tests for important functionality.
- Must-have tests:
  - Encrypt and decrypt round trip, and failure on tampered data
  - `.env` parser and exporter
  - Role checks (Admin, Manager, Developer)
  - RLS policies: a developer cannot read projects they are not assigned to
  - Audit log written on reveal, copy, edit and delete
  - Zod schemas for every form
- Run tests after implementation.
- Fix failing tests before continuing. Do not skip or delete tests to make them pass.
- Run lint, type check and build before opening a pull request:
  ```
  npm run lint
  npx tsc --noEmit
  npm run test
  npm run build
  ```

---

## Git

- Make small, focused commits. One logical change per commit.
- Use descriptive commit messages in the format `type: short description`.
  - `feat: add env variable import`
  - `fix: hide secret after timeout`
  - `refactor: move credential queries to service`
  - `docs: update architecture rules`
  - `test: add RLS tests for projects`
- Work on feature branches such as `feature/credentials-vault`. Never commit directly to `main`.
- Open a pull request for every change. At least one teammate reviews code that touches auth, crypto, RLS or secrets.
- Never commit secrets. If a secret is committed, treat it as leaked: rotate it immediately.

---

## AI Assistant Rules

- Read this file and the three project documents before starting work.
- Do not invent features, tables or packages that are not in the documentation.
- Do not change security-related code (crypto, auth, RLS, audit) unless the task explicitly asks for it. Explain the change clearly when you do.
- Never output real credentials in examples. Use clearly fake placeholders.
- If a task would break a rule here, stop and explain instead of working around it.
- After finishing, summarize which files changed and why.
- List anything you were unsure about or left incomplete.

---

## Definition of Done

A task is complete only when:

- [ ] It matches `PRD.md` scope and `DESIGN.md` styling
- [ ] It follows the layers in `ARCHITECTURE.md`
- [ ] Input is validated and authorization is checked server-side
- [ ] Secrets are encrypted, masked and never logged
- [ ] Audit logs are written where required
- [ ] Loading, empty and error states exist
- [ ] It works on mobile and desktop
- [ ] Tests are added and passing
- [ ] Lint, type check and build pass
- [ ] No unrelated files were changed

---

## Optional: Cursor Rules Structure

For Cursor, the same rules can be split into focused files:

```
.cursor/
└── rules/
    ├── general.mdc      (General, Before Coding, Git, AI Assistant Rules)
    ├── frontend.mdc     (UI, Design, Accessibility)
    ├── backend.mdc      (Architecture, Database, Error Handling)
    ├── security.mdc     (Security, Encryption, Authorization)  ← always applied
    └── testing.mdc      (Testing, Definition of Done)
```

Set `security.mdc` to **always apply** so it is included in every AI request.

---

**Remember: RULES.md = THE AI RULEBOOK.** `PRD.md` is what and why, `ARCHITECTURE.md` is how it works, `DESIGN.md` is how it looks, and `RULES.md` is how everyone must behave while building it.
