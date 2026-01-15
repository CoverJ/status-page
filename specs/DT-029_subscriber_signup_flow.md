# DT-029: Subscriber Signup Flow

## Epic
Epic 7: Public Status Page

## Description
Allow visitors to subscribe to status updates.

## Acceptance Criteria
- [ ] "Subscribe" button/link prominent on status page
- [ ] Subscription modal/page with email input
- [ ] Component selection (checkboxes, default all)
- [ ] Confirmation email sent with verification link
- [ ] Verification page confirms subscription
- [ ] Already subscribed handling (send email to manage)
- [ ] Rate limiting on signup (prevent abuse)

## Tech Notes
- Double opt-in required (GDPR compliance)
- Rate limit: 10 signups per IP per hour (KV counter)

## Dependencies
- DT-024: Status Page Layout & Styling
- DT-003: Database Schema - Auth & Subscribers
- DT-031: Email Service Integration

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix`
2. Run `pnpm run test:all`
3. Run `pnpm build`
4. Run `pnpm deploy`
5. Commit and push changes

## Related Tickets
- DT-030: Subscriber Preferences & Unsubscribe
- DT-022: Manual Subscriber Management
