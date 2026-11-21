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

| Use | Font |
|---|---|
| UI text | **Inter** |
| Passwords, API keys, env values, URLs | **JetBrains Mono** (fallback: `ui-monospace`, `monospace`) |

| Element | Size | Weight |
|---|---|---|
| Page title (H1) | 30px (`text-3xl`) | 600 |
| Section title (H2) | 20px (`text-xl`) | 600 |
| Card title (H3) | 16px (`text-base`) | 600 |
| Body | 14px (`text-sm`) | 400 |
| Label | 14px (`text-sm`) | 500 |
| Helper / caption | 12px (`text-xs`) | 400 |

Line height: 1.5 for body text. Never use more than two font families.

---

## Colors

### Light mode

| Role | Color |
|---|---|
| Primary | `#6366F1` |
| Primary hover | `#4F46E5` |
| Background | `#F8FAFC` |
| Surface (cards, dialogs) | `#FFFFFF` |
| Text | `#0F172A` |
| Muted text | `#64748B` |
| Border | `#E2E8F0` |
| Input background | `#FFFFFF` |

### Dark mode

| Role | Color |
|---|---|
| Primary | `#818CF8` |
| Background | `#0B1120` |
| Surface | `#111827` |
| Text | `#F1F5F9` |
| Muted text | `#94A3B8` |
| Border | `#1E293B` |

### Status colors

| Status | Color | Used for |
|---|---|---|
| Success | `#16A34A` | Saved, copied, active |
| Warning | `#D97706` | Expiring key, unsaved changes |
| Destructive | `#DC2626` | Delete, errors, revoked access |
| Info | `#0284C7` | Tips and notices |

### Environment badges

| Environment | Badge color |
|---|---|
| Development | Blue (`#0284C7`) |
| Staging | Amber (`#D97706`) |
| Production | Red (`#DC2626`) |

Production uses red on purpose to remind users they are touching live data.

### Role badges

| Role | Style |
|---|---|
| Admin | Primary (indigo) |
| Manager | Neutral dark |
| Developer | Neutral light |

Rules:
- Use shadcn CSS variables (`--primary`, `--background`, etc.) mapped to these values. Never hardcode hex values in components.
- Never rely on color alone to convey meaning. Pair it with an icon or text.

---

## Spacing and Layout

- Spacing scale: Tailwind default (multiples of 4px). Prefer `4, 6, 8` between elements and `16, 24` between sections.
- Page padding: 16px on mobile, 24px on tablet, 32px on desktop.
- Max content width: `1280px`, centered.
- Layout: fixed left **sidebar** (collapsible) + top header + content area.
- Use a consistent grid: 1 column on mobile, 2 on tablet, 3 to 4 on desktop for card grids.

---

## Border Radius, Borders and Shadows

| Element | Radius |
|---|---|
| Cards, dialogs | **12px** (`rounded-xl`) |
| Buttons, inputs, selects | **8px** (`rounded-lg`) |
| Badges | **9999px** (`rounded-full`) |
| Avatars | **9999px** |

- Borders: 1px solid border color. Prefer borders over heavy shadows.
- Shadows: `shadow-sm` for cards, `shadow-lg` for dialogs and dropdowns only.
- Never mix square and rounded corners on the same page.

---

## Buttons

| Variant | Use | Style |
|---|---|---|
| **Primary** | Main action on a page (Save, Add Client) | Solid indigo, white text |
| **Secondary** | Alternative actions (Cancel, Export) | Light gray fill, dark text |
| **Outline** | Low-emphasis actions | Border only |
| **Ghost** | Icon actions in tables and rows | No border, hover background |
| **Destructive** | Delete, revoke, remove access | Solid red, white text |

Rules:
- One Primary button per view.
- Height: 40px default, 32px small (tables), 44px for mobile touch targets.
- Icon buttons must have an `aria-label` and a tooltip.
- Buttons show a **spinner and are disabled** while an action is running.
- Destructive actions always ask for confirmation in a dialog.
- Icons come from **lucide-react**, 16px inside buttons, 20px elsewhere.

---

## Cards

- Background: surface color, 1px border, **12px radius**, `shadow-sm`.
- Padding: 24px on desktop, 16px on mobile.
- Structure: Header (title + action) → Content → optional Footer.
- Clickable cards show a subtle hover state (border turns primary at low opacity), never a large lift or scale.

---

## Forms and Inputs

- Labels sit above inputs, always visible. Never use placeholders as labels.
- Required fields are marked with `*`.
- Error messages appear directly under the field in destructive color, with an icon.
- Helper text sits under the field in muted color.
- Validation runs on submit and on blur. Don't show errors while the user is still typing for the first time.
- Use shadcn `Form` + React Hook Form + Zod.
- Focus ring: 2px primary color, visible on every interactive element.
- Long forms use Dialog (short) or a full page (long).

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
| Keep the same radius, spacing and fonts on every page | Mix rounded and square elements |
| Mask secrets by default | Show any secret on page load |
| Confirm destructive actions | Delete on a single click |
| Pair color with icon or text | Use color alone for meaning |
| Show loading, empty and error states | Leave blank screens |

---

**Remember: DESIGN.md = HOW IT SHOULD LOOK AND FEEL.** Product goals live in `PRD.md` and technical rules live in `ARCHITECTURE.md`.
