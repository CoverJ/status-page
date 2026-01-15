# DT-028: Incident History Page

## Epic
Epic 7: Public Status Page

## Description
Display historical incidents and maintenance.

## Acceptance Criteria
- [ ] Separate page: `/history` or linked from main page
- [ ] Calendar view showing incidents by day/week/month
- [ ] List view option showing incidents chronologically
- [ ] Filter by: date range, impact level, component
- [ ] Each incident expandable to show full timeline
- [ ] Pagination for long history (3 months default view)

## Tech Notes
- Heavy caching opportunity - historical data is immutable
- Could be statically generated daily

## Dependencies
- DT-024: Status Page Layout & Styling
- DT-004: Database Repository Layer

## Related Tickets
- DT-026: Active Incident Display
- DT-027: Scheduled Maintenance Display
