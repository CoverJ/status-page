# DT-032: Incident Notification Emails

## Epic
Epic 8: Email Notifications

## Description
Send email notifications for incident events.

## Acceptance Criteria
- [ ] Email sent on: incident created, incident updated, incident resolved
- [ ] Email content: incident name, status, impact, message, affected components
- [ ] Link to status page
- [ ] Unsubscribe and manage preferences links
- [ ] Only send to confirmed subscribers
- [ ] Respect component subscriptions (only notify relevant subscribers)
- [ ] Batch sending for large subscriber lists

## Tech Notes
- Queue-based: incident event -> queue -> worker -> email
- Batch: 100 emails per worker invocation

## Dependencies
- DT-031: Email Service Integration
- DT-019: Add Incident Update Flow

## Related Tickets
- DT-033: Maintenance Notification Emails
- DT-034: Email Delivery Tracking & Quarantine
