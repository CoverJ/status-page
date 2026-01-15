# DT-023: Subscriber Import/Export

## Epic
Epic 6: Admin Dashboard - Subscriber Management

## Description
Bulk import and export subscribers via CSV.

## Acceptance Criteria
- [ ] Export: download CSV of all subscribers (email, components, status, date)
- [ ] Import: upload CSV with email column (optional: components)
- [ ] Import preview showing what will be created
- [ ] Skip duplicates option
- [ ] Import progress indicator
- [ ] Import summary (created, skipped, errors)

## Tech Notes
- Use Cloudflare Queue for large imports (>100 subscribers)
- CSV parsing in worker

## Dependencies
- DT-021: Subscriber List View
- DT-022: Manual Subscriber Management

## Related Tickets
- DT-043: Manage API - Subscribers CRUD
