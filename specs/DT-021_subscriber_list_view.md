# DT-021: Subscriber List View

## Epic
Epic 6: Admin Dashboard - Subscriber Management

## Description
Display and manage subscribers.

## Acceptance Criteria
- [ ] List all subscribers with email, status, subscribed components, created date
- [ ] Status: confirmed, pending, unsubscribed, quarantined
- [ ] Filter by status
- [ ] Search by email
- [ ] Pagination (50 per page)
- [ ] Bulk actions: remove selected, export CSV
- [ ] Add subscriber manually button

## Tech Notes
- Quarantined = email delivery failed multiple times
- Show component names, not IDs

## Dependencies
- DT-004: Database Repository Layer
- DT-008: Dashboard Layout & Navigation

## Related Tickets
- DT-022: Manual Subscriber Management
- DT-023: Subscriber Import/Export
