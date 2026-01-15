# DT-030: Subscriber Preferences & Unsubscribe

## Epic
Epic 7: Public Status Page

## Description
Allow subscribers to manage their preferences.

## Acceptance Criteria
- [ ] Manage preferences link in all notification emails
- [ ] Preferences page: update component subscriptions
- [ ] Unsubscribe option (one-click from email, confirm on page)
- [ ] Resubscribe option for previously unsubscribed
- [ ] Secure access via signed token in email links

## Tech Notes
- Token signed with HMAC, includes subscriber_id and expiry
- No login required - token-based access

## Dependencies
- DT-029: Subscriber Signup Flow
- DT-031: Email Service Integration

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix`
2. Run `pnpm run test:all`
3. Run `pnpm build`
4. Run `pnpm deploy`
5. Commit and push changes

## Related Tickets
- DT-032: Incident Notification Emails
- DT-022: Manual Subscriber Management
