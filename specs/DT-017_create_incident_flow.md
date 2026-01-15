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

## Implementation Notes
- Use tailwindcss for all styling
- Use shadcn UI components (Form, Select, Checkbox, DatePicker, Button, Card)
- Run `pnpm lint:fix` with biome for code formatting

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix` to fix linting issues with biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Create a git commit with a descriptive message and push

## Dependencies
- DT-004: Database Repository Layer
- DT-016: Incident List View

## Related Tickets
- DT-018: Incident Detail & Update View
- DT-019: Add Incident Update Flow
- DT-020: Incident Templates
