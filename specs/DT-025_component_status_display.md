# DT-025: Component Status Display

## Epic
Epic 7: Public Status Page

## Description
Display current status of all components.

## Acceptance Criteria
- [ ] Components listed with name and status indicator
- [ ] Component groups collapsible (default expanded)
- [ ] Status color dot + text label (e.g., "Operational", "Degraded Performance")
- [ ] Hover/click shows component description if present
- [ ] Uptime percentage display (last 90 days) for showcased components
- [ ] Empty state if no components configured

## Tech Notes
- Calculate uptime from incident history
- Cache uptime calculations (update on incident resolve)

## Dependencies
- DT-024: Status Page Layout & Styling
- DT-004: Database Repository Layer

## Related Tickets
- DT-013: Component CRUD Operations
- DT-026: Active Incident Display
