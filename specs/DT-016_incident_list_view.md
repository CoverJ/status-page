# DT-016: Incident List View

## Epic
Epic 5: Admin Dashboard - Incident Management

## Description
Display active and past incidents.

## Acceptance Criteria
- [ ] Tabs: Active, Scheduled, Resolved
- [ ] Active tab shows investigating/identified/monitoring incidents
- [ ] Scheduled tab shows upcoming maintenance
- [ ] Resolved tab shows past incidents (paginated, 20 per page)
- [ ] Each row: name, status badge, impact badge, affected components, created date
- [ ] Click row to view/edit incident
- [ ] "Create Incident" button

## Tech Notes
- Default sort: most recent first
- Resolved incidents older than 90 days could be archived (future enhancement)

## Dependencies
- DT-004: Database Repository Layer
- DT-008: Dashboard Layout & Navigation

## Related Tickets
- DT-017: Create Incident Flow
- DT-018: Incident Detail & Update View
