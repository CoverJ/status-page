# DT-020: Incident Templates

## Epic
Epic 5: Admin Dashboard - Incident Management

## Description
Create and use templates for faster incident creation.

## Acceptance Criteria
- [ ] Template management UI in settings
- [ ] Template fields: name pattern, default impact, default message, default components
- [ ] "Use Template" dropdown on incident creation
- [ ] Template populates form fields (editable before submit)
- [ ] CRUD operations for templates
- [ ] At least 3 starter templates provided for new pages

## Tech Notes
- Add `incident_templates` table
- Starter templates: "Service Degradation", "Service Outage", "Scheduled Maintenance"

## Implementation Notes
- Use tailwindcss for all styling
- Use shadcn UI components (Form, Select, Input, Textarea, Button, Card, Dialog)
- Run `pnpm lint:fix` with biome for code formatting

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix` to fix linting issues with biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Create a git commit with a descriptive message and push

## Dependencies
- DT-002: Database Schema - Core Entities
- DT-017: Create Incident Flow

## Related Tickets
- DT-010: Page Settings Management
