# DT-022: Manual Subscriber Management

## Epic
Epic 6: Admin Dashboard - Subscriber Management

## Description
Allow adding and editing subscribers manually.

## Acceptance Criteria
- [ ] Add subscriber form: email, component subscriptions (or all)
- [ ] Skip confirmation option for manually added subscribers
- [ ] Edit subscriber: change component subscriptions
- [ ] Remove subscriber (soft delete - set unsubscribed_at)
- [ ] Reactivate unsubscribed subscriber
- [ ] Un-quarantine subscriber

## Tech Notes
- Skipping confirmation is admin override (trusted source)

## Dependencies
- DT-004: Database Repository Layer
- DT-021: Subscriber List View

## Related Tickets
- DT-023: Subscriber Import/Export
- DT-029: Subscriber Signup Flow
