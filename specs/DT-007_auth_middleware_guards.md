# DT-007: Auth Middleware & Guards

## Epic
Epic 2: Authentication System

## Description
Create middleware for protecting routes and API endpoints.

## Acceptance Criteria
- [ ] `requireAuth` middleware that validates session cookie
- [ ] `requirePageAccess` middleware that checks team membership
- [ ] `getCurrentUser` utility for Astro pages
- [ ] Redirect to login for unauthenticated dashboard access
- [ ] 401 response for unauthenticated API access
- [ ] Session refresh on activity (extend expiry)

## Tech Notes
- Middleware runs in Astro's `src/middleware.ts`
- Attach user to `Astro.locals` for page access

## Dependencies
- DT-005: Password Authentication
- DT-006: Magic Link Authentication

## Related Tickets
- DT-008: Dashboard Layout & Navigation
- DT-040: API Authentication
