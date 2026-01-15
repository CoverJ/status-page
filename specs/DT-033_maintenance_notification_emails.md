# DT-033: Maintenance Notification Emails

## Epic
Epic 8: Email Notifications

## Description
Send email notifications for scheduled maintenance.

## Acceptance Criteria
- [ ] Email sent when maintenance scheduled (24h before, configurable)
- [ ] Email sent when maintenance starts
- [ ] Email sent when maintenance completes
- [ ] Email content: maintenance name, scheduled time window, affected components
- [ ] Reminder email option (e.g., 1 hour before)

## Tech Notes
- Use Cloudflare Cron Triggers for scheduled sends
- Store notification preferences in page settings

## Dependencies
- DT-031: Email Service Integration
- DT-017: Create Incident Flow

## Related Tickets
- DT-032: Incident Notification Emails
- DT-027: Scheduled Maintenance Display
