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

## Implementation Notes
- Use tailwindcss for all styling
- Use shadcn UI components (Card, Badge, Button, Timeline, Dialog)
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
- DT-017: Create Incident Flow

## Related Tickets
- DT-019: Add Incident Update Flow
