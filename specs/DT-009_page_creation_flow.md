# DT-009: Page Creation Flow

## Epic
Epic 3: Admin Dashboard - Page Management

## Description
Allow users to create new status pages.

## Acceptance Criteria
- [ ] "Create Page" form with name and subdomain fields
- [ ] Subdomain validation (alphanumeric, hyphens, 3-63 chars)
- [ ] Subdomain availability check (real-time)
- [ ] Page created with user as owner
- [ ] Redirect to new page dashboard after creation
- [ ] Error handling for duplicate subdomains

## Tech Notes
- Subdomain check via API endpoint
- Use optimistic UI for better UX

## Dependencies
- DT-004: Database Repository Layer
- DT-008: Dashboard Layout & Navigation

## Related Tickets
- DT-010: Page Settings Management
- DT-044: Subdomain Routing
