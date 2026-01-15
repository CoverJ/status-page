# DT-019: Add Incident Update Flow

## Epic
Epic 5: Admin Dashboard - Incident Management

## Description
Allow team members to post incident updates.

## Acceptance Criteria
- [ ] Update form: new status, message, component status changes
- [ ] Status options based on incident type (incident vs maintenance states)
- [ ] Component status changes: dropdown for each affected component
- [ ] "Send notifications" checkbox
- [ ] Backdate option (display_at override)
- [ ] Resolving/completing an incident updates component statuses to operational

## Tech Notes
- When status becomes 'resolved' or 'completed', set incident.resolved_at

## Dependencies
- DT-017: Create Incident Flow
- DT-018: Incident Detail & Update View

## Related Tickets
- DT-032: Incident Notification Emails
