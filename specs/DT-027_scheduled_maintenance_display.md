# DT-027: Scheduled Maintenance Display

## Epic
Epic 7: Public Status Page

## Description
Show upcoming and in-progress maintenance windows.

## Acceptance Criteria
- [ ] Scheduled maintenance section shows upcoming windows
- [ ] Display: name, scheduled start/end times, affected components
- [ ] Time displayed in viewer's local timezone
- [ ] "In Progress" badge for active maintenance
- [ ] Maintenance windows appear 7 days before scheduled start
- [ ] Completed maintenance moves to incident history

## Tech Notes
- Use `Intl.DateTimeFormat` for timezone conversion client-side

## Dependencies
- DT-024: Status Page Layout & Styling
- DT-004: Database Repository Layer

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix`
2. Run `pnpm run test:all`
3. Run `pnpm build`
4. Run `pnpm deploy`
5. Commit and push changes

## Related Tickets
- DT-026: Active Incident Display
- DT-028: Incident History Page
- DT-033: Maintenance Notification Emails
