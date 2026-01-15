# DT-017: Create Incident Flow

## Epic
Epic 5: Admin Dashboard - Incident Management

## Description
Allow team members to create new incidents.

## Acceptance Criteria
- [ ] Incident type selection: Incident or Scheduled Maintenance
- [ ] Incident form: name, status, impact, message, affected components
- [ ] Maintenance form: adds scheduled_for and scheduled_until datetime pickers
- [ ] Component status changes: select new status for each affected component
- [ ] "Send notifications" checkbox (default checked)
- [ ] Preview of what subscribers will see
- [ ] Create incident and first update atomically

## Tech Notes
- Use a transaction for incident + update creation
- Datetime picker should respect page timezone

## Dependencies
- DT-004: Database Repository Layer
- DT-016: Incident List View

## Related Tickets
- DT-018: Incident Detail & Update View
- DT-019: Add Incident Update Flow
- DT-020: Incident Templates
