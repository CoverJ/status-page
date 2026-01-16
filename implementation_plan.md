# Golden Thread Implementation Plan

## Overview

This plan implements an end-to-end "golden thread" demonstrating data storage and retrieval through the system: **Admin creates a component → Public status page displays it**.

**Total Tickets:** 10
**Maximum Parallel Agents:** 2
**Estimated Waves:** 7

---

## Dependency Graph

```
                                    [DT-002 ✅]
                                         │
                                         ▼
                                    ┌─────────┐
                                    │ DT-003  │  Wave 1
                                    │ Schema  │
                                    └────┬────┘
                                         │
                                         ▼
                                    ┌─────────┐
                                    │ DT-004  │  Wave 2
                                    │  Repos  │
                                    └────┬────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
              ┌─────────┐                               ┌─────────┐
              │ DT-005  │                               │ DT-044  │  Wave 3
              │  Auth   │                               │ Routing │
              └────┬────┘                               └────┬────┘
                   │                                         │
                   ▼                                         ▼
              ┌─────────┐                               ┌─────────┐
              │ DT-007  │                               │ DT-024  │  Wave 4
              │ Middleware                              │ Layout  │
              └────┬────┘                               └────┬────┘
                   │                                         │
                   ▼                                         ▼
              ┌─────────┐                               ┌─────────┐
              │ DT-008  │                               │ DT-025  │  Wave 5
              │Dashboard│                               │ Display │
              └────┬────┘                               └────┬────┘
                   │                                         │
                   ▼                                         │
              ┌─────────┐                                    │
              │ DT-012  │  Wave 6                            │
              │CompList │                                    │
              └────┬────┘                                    │
                   │                                         │
                   ▼                                         │
              ┌─────────┐                                    │
              │ DT-013  │  Wave 7                            │
              │Comp CRUD│◄───────────────────────────────────┘
              └─────────┘         (Integration Point)

Track A (Admin): DT-003 → DT-004 → DT-005 → DT-007 → DT-008 → DT-012 → DT-013
Track B (Public): DT-003 → DT-004 → DT-044 → DT-024 → DT-025
```

---

## Git Worktree Strategy

Each parallel wave uses separate git worktrees to enable concurrent development without conflicts.

### Setup

```bash
# Create worktrees directory
mkdir -p ../status-page-worktrees

# For Wave 3 (example)
git worktree add ../status-page-worktrees/dt-005 -b feature/dt-005-password-auth
git worktree add ../status-page-worktrees/dt-044 -b feature/dt-044-subdomain-routing
```

### Branch Naming Convention

- `feature/dt-XXX-short-description`
- Example: `feature/dt-005-password-auth`

### Integration Strategy

After each wave completes:

1. **Integration Agent** (single agent) merges all feature branches from that wave into `main`
2. Integration Agent runs full verification suite
3. Integration Agent resolves any merge conflicts
4. Only after successful verification does the next wave begin

**CRITICAL: Only ONE agent handles integration and "wrap it up" verification per wave.**

---

## Wave Execution Plan

### Wave 1: Auth Schema (Sequential)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-003 | Agent 1 | `feature/dt-003-auth-schema` | `main` (no worktree needed) |

### Wave 2: Repository Layer (Sequential)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-004 | Agent 1 | `feature/dt-004-repository-layer` | `main` |

### Wave 3: Auth + Routing (Parallel)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-005 | Agent 1 | `feature/dt-005-password-auth` | `../status-page-worktrees/dt-005` |
| DT-044 | Agent 2 | `feature/dt-044-subdomain-routing` | `../status-page-worktrees/dt-044` |

### Wave 4: Middleware + Public Layout (Parallel)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-007 | Agent 1 | `feature/dt-007-auth-middleware` | `../status-page-worktrees/dt-007` |
| DT-024 | Agent 2 | `feature/dt-024-status-page-layout` | `../status-page-worktrees/dt-024` |

### Wave 5: Dashboard Shell + Component Display (Parallel)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-008 | Agent 1 | `feature/dt-008-dashboard-layout` | `../status-page-worktrees/dt-008` |
| DT-025 | Agent 2 | `feature/dt-025-component-display` | `../status-page-worktrees/dt-025` |

### Wave 6: Component List View (Sequential)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-012 | Agent 1 | `feature/dt-012-component-list` | `main` |

### Wave 7: Component CRUD (Sequential)

| Ticket | Agent | Branch | Worktree |
|--------|-------|--------|----------|
| DT-013 | Agent 1 | `feature/dt-013-component-crud` | `main` |

---

## Agent Prompts

### Wave 1: DT-003 - Auth Schema

```
You are implementing DT-003: Database Schema - Auth & Subscribers.

## Context
- Working directory: /mnt/c/dev/projects/status-page
- Branch: feature/dt-003-auth-schema (create from main)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-003_database_schema_auth_subscribers.md
- Existing schema: /mnt/c/dev/projects/status-page/src/db/schema/

## Task
Create Drizzle ORM schema files for authentication and subscriber tables:
- `users` table (user_id, email, password_hash, name, created_at, updated_at, last_login_at)
- `sessions` table (session_id, user_id, expires_at, created_at)
- `magic_links` table (token, user_id, expires_at, used_at, created_at)
- `team_members` table (team_member_id, page_id, user_id, role, created_at)
- `subscribers` table (subscriber_id, page_id, email, component_ids, confirmed_at, quarantined_at, unsubscribed_at, created_at)
- `subscriber_confirmations` table (token, subscriber_id, expires_at, created_at)

## Tech Notes
- Follow patterns in existing schema files (pages.ts, components.ts, incidents.ts)
- Role enum: 'owner', 'admin', 'member'
- Add appropriate indexes on email fields and foreign keys
- Export all tables from src/db/schema/index.ts

## DO NOT run "wrap it up" verification
Another agent will handle integration and verification. Just:
1. Implement the schema
2. Ensure code compiles (`pnpm build` for quick check)
3. Commit to your feature branch with descriptive message
4. Push the branch

DO NOT run lint:fix, test:all, deploy, or merge to main.
```

---

### Wave 2: DT-004 - Repository Layer

```
You are implementing DT-004: Database Repository Layer.

## Context
- Working directory: /mnt/c/dev/projects/status-page
- Branch: feature/dt-004-repository-layer (create from main after Wave 1 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-004_database_repository_layer.md
- Schema location: /mnt/c/dev/projects/status-page/src/db/schema/

## Task
Create type-safe repository functions in `src/db/repositories/`:
- `PageRepository` - CRUD + findBySubdomain
- `ComponentRepository` - CRUD + findByPageId + reorder
- `ComponentGroupRepository` - CRUD + findByPageId
- `IncidentRepository` - CRUD + findByPageId + findUnresolved + findScheduled
- `IncidentUpdateRepository` - create + findByIncidentId
- `SubscriberRepository` - CRUD + findByPageId + findConfirmed
- `UserRepository` - CRUD + findByEmail
- `SessionRepository` - create + findValid + delete

## Tech Notes
- Repositories accept D1 database instance as parameter
- Use Drizzle's `eq`, `and`, `desc` helpers
- Return typed results using Drizzle inference
- Create index.ts that exports all repositories

## DO NOT run "wrap it up" verification
Another agent will handle integration and verification. Just:
1. Implement the repositories
2. Ensure code compiles (`pnpm build` for quick check)
3. Commit to your feature branch with descriptive message
4. Push the branch

DO NOT run lint:fix, test:all, deploy, or merge to main.
```

---

### Wave 3a: DT-005 - Password Authentication

```
You are implementing DT-005: Password Authentication.

## Context
- Working directory: /mnt/c/dev/projects/status-page (or assigned worktree)
- Branch: feature/dt-005-password-auth (create from main after Wave 2 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-005_password_authentication.md
- Repositories: src/db/repositories/

## Task
Implement password-based authentication:
- Password hashing utility using PBKDF2 (100k iterations, SHA-256) via Web Crypto API
- Password verification utility
- Password strength validation (min 8 chars, complexity rules)
- Signup endpoint: POST /api/auth/signup
- Login endpoint: POST /api/auth/login
- Logout endpoint: POST /api/auth/logout
- Session stored in HTTP-only cookie (Secure, SameSite=Lax, 30 day expiry)

## Tech Notes
- Use Web Crypto API (available in Cloudflare Workers)
- Place auth utilities in src/lib/auth/
- Place API endpoints in src/pages/api/auth/

## DO NOT run "wrap it up" verification
Another agent will handle integration and verification. Just:
1. Implement the authentication system
2. Ensure code compiles (`pnpm build` for quick check)
3. Commit to your feature branch with descriptive message
4. Push the branch

DO NOT run lint:fix, test:all, deploy, or merge to main.
```

---

### Wave 3b: DT-044 - Subdomain Routing

```
You are implementing DT-044: Subdomain Routing.

## Context
- Working directory: Assigned worktree (../status-page-worktrees/dt-044)
- Branch: feature/dt-044-subdomain-routing (create from main after Wave 2 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-044_subdomain_routing.md
- Repositories: src/db/repositories/

## Task
Implement subdomain-based routing:
- `{subdomain}.downtime.online` routes to that page's status page
- Unknown subdomains show 404 page
- Reserved subdomains: www, app, api, admin, status, mail
- Admin dashboard accessible at `app.downtime.online`
- API accessible at `api.downtime.online`

## Tech Notes
- Implement in Astro middleware (src/middleware.ts)
- Cloudflare Workers can access hostname from request
- Use KV cache for subdomain lookups with D1 fallback
- Store resolved page info in Astro.locals

## DO NOT run "wrap it up" verification
Another agent will handle integration and verification. Just:
1. Implement the routing system
2. Ensure code compiles (`pnpm build` for quick check)
3. Commit to your feature branch with descriptive message
4. Push the branch

DO NOT run lint:fix, test:all, deploy, or merge to main.
```

---

### Wave 4a: DT-007 - Auth Middleware

```
You are implementing DT-007: Auth Middleware & Guards.

## Context
- Working directory: Assigned worktree
- Branch: feature/dt-007-auth-middleware (create from main after Wave 3 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-007_auth_middleware_guards.md
- Auth utilities: src/lib/auth/

## Task
Create middleware for route protection:
- `requireAuth` middleware that validates session cookie
- `requirePageAccess` middleware that checks team membership
- `getCurrentUser` utility for Astro pages
- Redirect to login for unauthenticated dashboard access
- 401 response for unauthenticated API access
- Session refresh on activity (extend expiry)

## Tech Notes
- Middleware in src/middleware.ts (extend existing subdomain routing)
- Attach user to Astro.locals for page access
- Dashboard routes are under /dashboard/*

## DO NOT run "wrap it up" verification
Another agent will handle integration. Just implement, commit, and push.
```

---

### Wave 4b: DT-024 - Status Page Layout

```
You are implementing DT-024: Status Page Layout & Styling.

## Context
- Working directory: Assigned worktree
- Branch: feature/dt-024-status-page-layout (create from main after Wave 3 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-024_status_page_layout_styling.md
- UI components: src/components/ui/ (shadcn)

## Task
Create the public-facing status page layout:
- Clean, minimal layout (Statuspage-like)
- Page header with logo/name
- Overall status banner ("All Systems Operational" or worst status)
- Color-coded status indicator
- Footer with "Subscribe to Updates" link
- Mobile responsive
- Target: <1s TTFB

## Tech Notes
- Create layout at src/layouts/StatusPageLayout.astro
- Create page at src/pages/status/[subdomain].astro (or use middleware-resolved page)
- Static-first with dynamic hydration for interactive elements
- Use Tailwind + shadcn components

## DO NOT run "wrap it up" verification
Another agent will handle integration. Just implement, commit, and push.
```

---

### Wave 5a: DT-008 - Dashboard Layout

```
You are implementing DT-008: Dashboard Layout & Navigation.

## Context
- Working directory: Assigned worktree
- Branch: feature/dt-008-dashboard-layout (create from main after Wave 4 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-008_dashboard_layout_navigation.md
- UI components: src/components/ui/ (shadcn)

## Task
Create admin dashboard shell:
- Dashboard layout with sidebar navigation
- Nav items: Overview, Components, Incidents, Maintenance, Subscribers, Settings
- Page selector dropdown (for users with multiple pages)
- User menu with logout option
- Responsive design (sidebar collapses on mobile)
- Loading states for page transitions

## Tech Notes
- Create layout at src/layouts/DashboardLayout.astro
- React components for interactive elements (sidebar, dropdowns)
- Dashboard routes under src/pages/dashboard/

## DO NOT run "wrap it up" verification
Another agent will handle integration. Just implement, commit, and push.
```

---

### Wave 5b: DT-025 - Component Status Display

```
You are implementing DT-025: Component Status Display.

## Context
- Working directory: Assigned worktree
- Branch: feature/dt-025-component-display (create from main after Wave 4 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-025_component_status_display.md
- Repositories: src/db/repositories/
- Status page layout: src/layouts/StatusPageLayout.astro

## Task
Display current component statuses on public page:
- Components listed with name and status indicator
- Component groups collapsible (default expanded)
- Status color dot + text label ("Operational", "Degraded Performance", etc.)
- Hover/click shows component description
- Uptime percentage (last 90 days) for showcased components
- Empty state if no components configured

## Tech Notes
- Color mapping: operational=green, degraded=yellow, partial=orange, major=red, maintenance=blue
- Calculate uptime from incident history (can be placeholder for MVP)
- Create component at src/components/status/ComponentList.tsx

## DO NOT run "wrap it up" verification
Another agent will handle integration. Just implement, commit, and push.
```

---

### Wave 6: DT-012 - Component List View

```
You are implementing DT-012: Component List View.

## Context
- Working directory: /mnt/c/dev/projects/status-page
- Branch: feature/dt-012-component-list (create from main after Wave 5 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-012_component_list_view.md
- Dashboard layout: src/layouts/DashboardLayout.astro
- Repositories: src/db/repositories/

## Task
Create admin component management view:
- List all components grouped by component group
- Ungrouped components shown separately
- Display component name, current status, status indicator color
- Quick status change dropdown on each component
- Add component button
- Add group button
- Empty state for pages with no components

## Tech Notes
- Color mapping: operational=green, degraded=yellow, partial=orange, major=red, maintenance=blue
- Create page at src/pages/dashboard/components/index.astro
- React component for interactive list: src/components/dashboard/ComponentList.tsx

## DO NOT run "wrap it up" verification
Another agent will handle integration. Just implement, commit, and push.
```

---

### Wave 7: DT-013 - Component CRUD

```
You are implementing DT-013: Component CRUD Operations.

## Context
- Working directory: /mnt/c/dev/projects/status-page
- Branch: feature/dt-013-component-crud (create from main after Wave 6 merge)
- Spec: /mnt/c/dev/projects/status-page/specs/DT-013_component_crud_operations.md
- Component list: src/components/dashboard/ComponentList.tsx
- Repositories: src/db/repositories/

## Task
Implement component create/edit/delete:
- Create component modal (name, description, group selection)
- Edit component modal (same fields)
- Delete component with confirmation dialog
- Validation: name required, max 100 chars
- Component position auto-assigned on create
- Success/error toast notifications

## Tech Notes
- API endpoints: POST/PUT/DELETE /api/components
- For MVP, hard delete is acceptable
- Use shadcn Dialog, Form, Toast components

## DO NOT run "wrap it up" verification
Another agent will handle integration. Just implement, commit, and push.
```

---

## Integration Agent Prompt (Run After Each Wave)

```
You are the Integration Agent responsible for merging and verifying wave completion.

## Context
- Working directory: /mnt/c/dev/projects/status-page
- Current wave: [WAVE_NUMBER]
- Branches to merge: [LIST_OF_BRANCHES]

## Task

### 1. Merge Feature Branches
For each branch in this wave:
```bash
git fetch origin
git checkout main
git pull origin main
git merge origin/[branch-name] --no-ff -m "Merge [branch-name]: [ticket description]"
```

If merge conflicts occur:
- Resolve conflicts carefully
- Ensure both features remain functional
- Document any significant decisions

### 2. Run "Wrap It Up" Process
Execute the full verification suite:
```bash
pnpm run lint:fix
pnpm run test:all
pnpm build
pnpm run deploy
```

If ANY step fails:
- STOP immediately
- Fix the issue
- Restart from step 1 (lint:fix)

### 3. Commit and Push
Only after all verification passes:
```bash
git add .
git commit -m "Complete Wave [N]: [list of tickets]

Integrated: [DT-XXX, DT-YYY]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push origin main
```

### 4. Update ToC
Mark completed tickets in /specs/ToC.md by adding ✅ to the Done column.

### 5. Clean Up Worktrees
```bash
git worktree remove ../status-page-worktrees/dt-XXX
git branch -d feature/dt-XXX-description
```

## CRITICAL
- You are the ONLY agent that runs verification
- Do not proceed to next wave until ALL checks pass
- If verification fails, coordinate with the relevant feature agent to fix issues
```

---

## Execution Checklist

- [ ] **Wave 1**: DT-003 (Auth Schema)
  - [ ] Agent completes implementation
  - [ ] Integration Agent merges and verifies

- [ ] **Wave 2**: DT-004 (Repository Layer)
  - [ ] Agent completes implementation
  - [ ] Integration Agent merges and verifies

- [ ] **Wave 3**: DT-005 + DT-044 (Parallel)
  - [ ] Set up worktrees for parallel work
  - [ ] Agent 1 completes DT-005
  - [ ] Agent 2 completes DT-044
  - [ ] Integration Agent merges both and verifies

- [ ] **Wave 4**: DT-007 + DT-024 (Parallel)
  - [ ] Set up worktrees
  - [ ] Agent 1 completes DT-007
  - [ ] Agent 2 completes DT-024
  - [ ] Integration Agent merges both and verifies

- [ ] **Wave 5**: DT-008 + DT-025 (Parallel)
  - [ ] Set up worktrees
  - [ ] Agent 1 completes DT-008
  - [ ] Agent 2 completes DT-025
  - [ ] Integration Agent merges both and verifies

- [ ] **Wave 6**: DT-012 (Component List View)
  - [ ] Agent completes implementation
  - [ ] Integration Agent merges and verifies

- [ ] **Wave 7**: DT-013 (Component CRUD)
  - [ ] Agent completes implementation
  - [ ] Integration Agent merges and verifies
  - [ ] **GOLDEN THREAD COMPLETE**

---

## Validation: End-to-End Test

After Wave 7 completes, verify the golden thread:

1. **Navigate to** `app.downtime.online/dashboard`
2. **Login** with test credentials
3. **Create a component** via the dashboard
4. **Navigate to** `{subdomain}.downtime.online`
5. **Verify** the component appears on the public status page

If this flow works, the golden thread is complete.

If this flow fails, engage with the user to work out next steps.
