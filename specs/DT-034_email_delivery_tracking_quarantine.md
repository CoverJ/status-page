# DT-034: Email Delivery Tracking & Quarantine

## Epic
Epic 8: Email Notifications

## Description
Track email delivery and handle failures.

## Acceptance Criteria
- [ ] Log all email send attempts (success/failure)
- [ ] Webhook endpoint for Resend delivery events
- [ ] Track bounces and complaints
- [ ] Auto-quarantine after 3 consecutive failures
- [ ] Quarantined subscribers excluded from future sends
- [ ] Admin notification when subscriber quarantined

## Tech Notes
- Add `email_logs` table for tracking
- Resend webhooks for bounce/complaint events

## Dependencies
- DT-031: Email Service Integration
- DT-032: Incident Notification Emails

## Related Tickets
- DT-021: Subscriber List View
- DT-022: Manual Subscriber Management

## Testing/QA
Follow the "wrap it up" process before completing this ticket:
1. Run `pnpm run lint:fix` to lint and format code with Biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Commit changes with a descriptive message and push
