<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Critical Agent Rules & Mandatory Guidelines

## Monorepo Structure
- The repository is an npm-workspaces monorepo.
- Applications live in `apps/`. Run commands from the repo root (e.g. `npm run build -w web`) or within workspace directories.
- The Next.js web application lives in `apps/web`.
- Future browser extension and desktop applications will live in `apps/extension` and `apps/desktop`. Shared code moves to `packages/` as needed.

## 1. STRICT SHADCN MANDATE
- **ALWAYS use shadcn/ui components**: Check the shadcn component library for ANY UI requirement (e.g. sidebar, breadcrumb, avatar, table, dialog, alert-dialog, sheet, dropdown-menu, form, tabs, tooltip, popover, badge, button, input, separator, etc.).
- **NEVER build custom components from scratch** when a shadcn component exists for that capability.
- **Check and Install**: If a required shadcn component is not already present in `apps/web/src/components/ui/`, **ALWAYS install it immediately** using `npx shadcn add <component-name>` inside `apps/web` and use it.
- **NEVER edit `apps/web/src/components/ui/*` directly**: Treat them as unmodified primitives from shadcn. Compose and style them via props, wrappers, or `render` props.

## 2. MODULAR CODE & LEAN PAGES
- **Keep page files lean (< 25 lines)**: Page files (`page.tsx`) must only do route-level auth checks/fetching and delegate rendering to modular, reusable feature components in `apps/web/src/features/<feature>/components/*`.
- **Don't dump large codeblocks in a single file**: Extract reusable parts into `apps/web/src/components/` (generic UI) or `apps/web/src/features/<feature>/` (domain-specific UI & schemas).

## 3. ALWAYS READ AND UPDATE DOCS
- AI agents must ALWAYS read `docs/RULES.md`, `docs/TASKS.md`, and `docs/MEMORY.md` before starting work.
- **Update `docs/MEMORY.md` and `docs/TASKS.md` at the end of every task/phase** without exception. Keep `docs/MEMORY.md` accurate and matching the code at all times.

## 4. STATE MANAGEMENT
- Use **Zustand** if client-side global state management is needed (e.g. cross-component UI state, command palettes, search/filter states, modal controllers).
- Install with `npm install zustand` whenever global client state is required. Avoid complex/heavy alternatives like Redux.

## 5. DARK MODE MANDATE
- **Always use Dark Mode**: The app is strictly and permanently dark mode only.
- Do NOT provide light or system theme options or toggles.

