# DT-010: Page Settings Management

## Epic
Epic 3: Admin Dashboard - Page Management

## Description
Allow page owners to configure page settings.

## Acceptance Criteria
- [ ] Settings page with form for: name, description, subdomain
- [ ] Custom domain configuration field (display only for MVP)
- [ ] Time zone selection for incident timestamps
- [ ] "All Systems Operational" custom text override
- [ ] Save confirmation with success/error feedback
- [ ] Only page owners can access settings

## Tech Notes
- Store timezone as IANA timezone string
- Validate subdomain changes don't conflict

## Dependencies
- DT-004: Database Repository Layer
- DT-008: Dashboard Layout & Navigation

## Related Tickets
- DT-009: Page Creation Flow
- DT-011: Team Member Management
- DT-045: Custom Domain Support
