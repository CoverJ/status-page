# DT-026: Active Incident Display

## Epic
Epic 7: Public Status Page

## Description
Show current unresolved incidents on status page.

## Acceptance Criteria
- [ ] Active incidents section appears when incidents exist
- [ ] Each incident shows: name, impact badge, affected components, latest update
- [ ] Update timeline expandable to show all updates
- [ ] Timestamp formatting relative ("2 hours ago") and absolute on hover
- [ ] Visual distinction between incidents and maintenance
- [ ] "No active incidents" hidden when empty (show operational banner instead)

## Tech Notes
- Real-time updates not required for MVP (refresh to see updates)
- Could add polling or SSE in future

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
- DT-025: Component Status Display
- DT-027: Scheduled Maintenance Display
