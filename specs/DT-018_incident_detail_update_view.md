# DT-018: Incident Detail & Update View

## Epic
Epic 5: Admin Dashboard - Incident Management

## Description
View incident details and add updates.

## Acceptance Criteria
- [ ] Incident header: name, status, impact, created date
- [ ] Timeline of all updates (newest first)
- [ ] Each update shows: status, message, timestamp, component changes
- [ ] "Add Update" button opens update form
- [ ] Quick status change without full update form
- [ ] Edit incident name/impact (not status - use updates for that)

## Tech Notes
- Updates are immutable once created
- Incident name edits should be rare (for typo fixes)

## Dependencies
- DT-004: Database Repository Layer
- DT-016: Incident List View
- DT-017: Create Incident Flow

## Related Tickets
- DT-019: Add Incident Update Flow
