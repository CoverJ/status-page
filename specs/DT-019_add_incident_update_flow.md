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

## Implementation Notes
- Use tailwindcss for all styling
- Use shadcn UI components (Form, Select, Checkbox, DatePicker, Textarea, Button)
- Run `pnpm lint:fix` with biome for code formatting

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix` to fix linting issues with biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Create a git commit with a descriptive message and push

## Dependencies
- DT-017: Create Incident Flow
- DT-018: Incident Detail & Update View

## Related Tickets
- DT-032: Incident Notification Emails
