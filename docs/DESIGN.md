# Design System

## Style
Modern, minimal, professional, and trustworthy. This is a security tool used daily by developers, so the interface should feel calm, clear and fast. No decorative clutter, no flashy gradients, no heavy animation.

Design principles:
1. **Clarity over decoration:** every element has a purpose.
2. **Secrets are protected by default:** sensitive values are always masked until the user acts.
3. **Speed:** common actions (search, copy) take one click.
4. **Consistency:** the same component looks and behaves the same on every page.

---

## Typography

| Use | Font | CSS Variable |
|---|---|---|
| UI text & headings | **Inter** / Geist Sans | `--font-sans` |
| Passwords, API keys, env values, code, URLs | **JetBrains Mono** / Geist Mono | `--font-mono` |

| Element | Size | Weight |
|---|---|---|
| Page title (H1) | 30px (`text-3xl`) | 600 |
| Section title (H2) | 20px (`text-xl`) | 600 |
| Card title (H3) | 16px (`text-base`) | 600 |
| Body | 14px (`text-sm`) | 400 |
| Label | 14px (`text-sm`) | 500 |
| Helper / caption | 12px (`text-xs`) | 400 |

Line height: 1.5 for body text.

---

## Colors & Design Tokens

The application uses the installed **shadcn `base-vega` (zinc)** theme powered by Tailwind CSS v4 and CSS variables (OKLCH). All components must consume these CSS variables directly (or standard Tailwind utility classes like `bg-primary`, `text-foreground`, `border-border`) rather than hardcoded hex values.

### Theme Palette (shadcn CSS Variables)

| Role | Light Mode Token | Dark Mode Token | Semantic Class |
|---|---|---|---|
| Background | `oklch(1 0 0)` | `oklch(0.141 0.005 285.823)` | `bg-background` |
| Foreground / Text | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` | `text-foreground` |
| Card / Surface | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | `bg-card text-card-foreground` |
| Popover / Dialog | `oklch(1 0 0)` | `oklch(0.21 0.006 285.885)` | `bg-popover text-popover-foreground` |
| Primary | `oklch(0.21 0.006 285.885)` | `oklch(0.92 0.004 286.32)` | `bg-primary text-primary-foreground` |
| Secondary | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | `bg-secondary text-secondary-foreground` |
| Muted | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | `bg-muted text-muted-foreground` |
| Accent | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | `bg-accent text-accent-foreground` |
| Destructive | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | `bg-destructive text-white` |
| Border | `oklch(0.92 0.004 286.32)` | `oklch(1 0 0 / 10%)` | `border-border` |
| Input Border | `oklch(0.92 0.004 286.32)` | `oklch(1 0 0 / 15%)` | `border-input` |
| Focus Ring | `oklch(0.705 0.015 286.067)` | `oklch(0.552 0.016 285.938)` | `ring-ring` |
| Sidebar Surface | `oklch(0.985 0 0)` | `oklch(0.21 0.006 285.885)` | `bg-sidebar text-sidebar-foreground` |

### Status Colors

| Status | Color | Used for |
|---|---|---|
| Success | Green (`#16A34A` / `text-green-600`) | Saved, copied, active status |
| Warning | Amber (`#D97706` / `text-amber-600`) | Expiring key, unsaved changes |
| Destructive | `var(--destructive)` | Delete, errors, revoked access |
| Info | Sky (`#0284C7` / `text-sky-600`) | Tips, notice banners |

### Environment Badges

| Environment | Badge color | Class |
|---|---|---|
| Development | Blue | `bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400` |
| Staging | Amber | `bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400` |
| Production | Red | `bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400` |

Production uses red on purpose to remind users they are touching live client data.

### Role Badges

| Role | Style |
|---|---|
| Admin | `bg-primary text-primary-foreground` |
| Manager | `bg-secondary text-secondary-foreground border-border` |
| Developer | `bg-muted text-muted-foreground border-border` |

Rules:
- Always use shadcn CSS variables and Tailwind classes. Never hardcode one-off hex values in components.
- Never rely on color alone to convey meaning. Pair it with an icon or clear text.

---

## Spacing and Layout

- Spacing scale: Tailwind default (multiples of 4px: `p-2`, `p-4`, `p-6`, `gap-3`, etc.).
- Page padding: 16px (`p-4`) on mobile, 24px (`p-6`) on tablet, 32px (`p-8`) on desktop.
- Max content width: `1280px` (`max-w-7xl`), centered.
- Layout: collapsible left sidebar (`src/components/ui/sidebar.tsx`) + top header + main content.
- Consistent grid: 1 column on mobile, 2 on tablet, 3 to 4 on desktop.

---

## Border Radius, Borders and Shadows

The design uses the installed shadcn base radius `--radius: 0.625rem` (10px):

| Token | Calculated Value | Used for |
|---|---|---|
| `--radius-sm` | `calc(var(--radius) * 0.6)` (~6px) | Compact elements, small tags |
| `--radius-md` | `calc(var(--radius) * 0.8)` (~8px) | Buttons, inputs, selects |
| `--radius-lg` | `var(--radius)` (10px) | Cards, dialogs, dropdowns |
| `--radius-xl` | `calc(var(--radius) * 1.4)` (14px) | Large modal containers |
| Full / Pill | `rounded-full` | Badges, status chips, avatars |

- Borders: 1px solid `border-border`. Prefer clean borders over heavy shadows.
- Shadows: `shadow-xs` / `shadow-sm` for cards, `shadow-lg` for dialogs and popovers.

---

## Component Guidelines (Do Not Edit `components/ui/*`)

All base UI primitives are installed in `src/components/ui/` using shadcn (built on Base UI).
**Rule: Do not edit shadcn components in `src/components/ui/*` directly.** Build application features and layouts on top of them by passing standard props, classes, and slots.

### Buttons (`src/components/ui/button.tsx`)
- Variants: `default` (primary), `outline`, `secondary`, `ghost`, `destructive`, `link`.
- Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
- One primary (`default`) button per view.
- Icon buttons must include an `aria-label` and tooltip.
- Buttons show a loading state (spinner) and are disabled while submitting.
- Destructive actions always require confirmation via `AlertDialog`.
- Icons from **lucide-react** (16px inside buttons, 20px in navigation).

### Forms and Inputs (`field.tsx`, `label.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`)
- Built with `@base-ui/react` form primitives (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`).
- Labels sit above inputs, always visible. Never use placeholders as labels.
- Required fields marked with `*`.
- Validation errors appear in `FieldError` with destructive styling.
- Pair with React Hook Form + Zod for type-safe validation.
- Focus ring: `focus-visible:ring-3 focus-visible:ring-ring/50 outline-none`.

---

## Secret Field Component

The most important component in the app. It must look and behave identically everywhere.

| State | Appearance |
|---|---|
| **Hidden (default)** | `••••••••••••` in monospace, with Reveal and Copy icon buttons |
| **Loading** | Small spinner while the server decrypts |
| **Revealed** | Plain value in monospace, with Hide and Copy buttons |
| **Copied** | Check icon plus toast "Copied. Clipboard clears in 30s" |

Rules:
- Always hidden on page load.
- Auto-hides again after **15 seconds**.
- Hidden mask length is fixed and does not reveal the real password length.
- Values are never selectable while hidden.
- Long values (API keys) truncate with ellipsis, full value on reveal.

---

## Tables

- Use shadcn `Table` with a sticky header on long lists.
- Row height: 48px. Zebra striping is not used. Use a subtle hover background.
- Required for list pages: search, sort, pagination (20 rows per page).
- Row actions live in a `...` dropdown menu (Edit, Duplicate, Delete).
- On mobile, tables become stacked cards or scroll horizontally inside a container.
- Audit log table is read-only and shows relative time with the full timestamp on hover.

---

## Navigation

**Sidebar items:**
1. Dashboard
2. Clients
3. Projects
4. Audit Logs (Admin only)
5. Team (Admin only)
6. Settings

- Active item: primary tint background and primary text.
- On mobile, the sidebar becomes a slide-in sheet opened from a menu button.
- Breadcrumbs on detail pages: `Clients / Acme Corp / Ecommerce Platform`.
- Project page uses **Tabs**: Credentials | Env Variables | Notes | Files.
- Items the user has no permission for are hidden, not just disabled.

---

## Dialogs and Feedback

| Pattern | Component | Rule |
|---|---|---|
| Add / edit form | Dialog | Closes on success, shows a toast |
| Delete confirmation | AlertDialog | States exactly what will be deleted, red confirm button |
| Success / error feedback | Sonner toast | Auto-dismiss in 4 seconds, errors stay until dismissed |
| Unsaved changes | AlertDialog | Warn before leaving |
| Destructive on production data | AlertDialog | Requires typing the project name to confirm |

---

## Page Templates

### List page (Clients, Projects)
```
Title + description            [ + Add Button ]
[ Search ]  [ Filters ]
┌──────────────────────────────────────────┐
│ Table / Card grid                        │
└──────────────────────────────────────────┘
Pagination
```

### Detail page (Project)
```
Breadcrumb
Title  [Status badge]                [ Edit ]
Info cards (URL, repo, hosting, tech stack)
Tabs: Credentials | Env Variables | Notes | Files
┌──────────────────────────────────────────┐
│ Tab content                              │
└──────────────────────────────────────────┘
```

### Env Variables tab
- Environment switcher (Dev | Staging | Prod) as tabs or segmented control
- Table of Key | Value (secret field) | Actions
- Buttons: Add Variable, Paste .env, Export .env

---

## UX Requirements

- **Mobile responsive:** works from 360px upward. Touch targets at least 44px.
- **Loading states:** skeleton loaders for lists and cards, spinners for buttons. No blank screens.
- **Empty states:** every list shows an icon, a short explanation and a clear call-to-action (for example "No credentials yet. Add the first login for this project.").
- **Error states:** friendly message, what went wrong, and a retry button. Never show raw error text or stack traces. Never include secrets in error messages.
- **Accessible forms:** labels linked to inputs, error messages announced to screen readers (`aria-describedby`, `aria-invalid`), full keyboard navigation.
- **Accessibility:** WCAG AA contrast, visible focus rings, `aria-label` on icon buttons, dialogs trap focus, supports `prefers-reduced-motion`.
- **Dark mode:** supported through system preference with a manual toggle.
- **Session safety:** show a clear notice before auto-logout from inactivity, and blur or lock the screen when the session expires.
- **Feedback:** every user action gets visible feedback within 100ms (spinner, toast or state change).

---

## Motion

- Subtle and quick: 150 to 200ms ease-out transitions.
- Allowed: hover color changes, dialog fade and scale, toast slide, skeleton pulse.
- Not allowed: bouncing, parallax, long animations, auto-playing effects.

---

## Voice and Content

- Short, direct, plain language. No jargon where a simple word works.
- Buttons use verbs: "Add credential", "Copy password", "Export .env".
- Error messages say what happened and what to do next.
- Use sentence case everywhere ("Add new client", not "Add New Client").

---

## Do and Don't

| Do | Don't |
|---|---|
| Use shadcn/ui components and CSS variables | Create custom one-off button or card styles |
| Use installed shadcn components as-is (wrap or pass props) | Edit files in `src/components/ui/` directly |
| Keep the same radius, spacing and fonts on every page | Mix rounded and square elements |
| Mask secrets by default | Show any secret on page load |
| Confirm destructive actions | Delete on a single click |
| Pair color with icon or text | Use color alone for meaning |
| Show loading, empty and error states | Leave blank screens |

---

**Remember: DESIGN.md = HOW IT SHOULD LOOK AND FEEL.** Product goals live in `PRD.md` and technical rules live in `ARCHITECTURE.md`.
