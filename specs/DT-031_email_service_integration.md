# DT-031: Email Service Integration

## Epic
Epic 8: Email Notifications

## Description
Set up email sending infrastructure with Resend.

## Acceptance Criteria
- [ ] Resend SDK configured
- [ ] Email sending utility function with error handling
- [ ] Retry logic for transient failures (3 attempts)
- [ ] Email templates using React Email or HTML
- [ ] From address configuration per page (or default)
- [ ] Unsubscribe header (List-Unsubscribe) in all emails

## Tech Notes
- Use Cloudflare Queue for email sending (async, reliable)
- Store API key in Cloudflare secrets

## Dependencies
- DT-001: Project Structure & Configuration

## Related Tickets
- DT-006: Magic Link Authentication
- DT-029: Subscriber Signup Flow
- DT-032: Incident Notification Emails

## Testing/QA
Follow the "wrap it up" process before completing this ticket:
1. Run `pnpm run lint:fix` to lint and format code with Biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Commit changes with a descriptive message and push
