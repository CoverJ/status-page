# DT-011: Team Member Management

## Epic
Epic 3: Admin Dashboard - Page Management

## Description
Allow page owners to invite and manage team members.

## Acceptance Criteria
- [ ] Team members list showing email, role, joined date
- [ ] Invite form with email and role selection
- [ ] Invitation email sent to new team members
- [ ] Accept invitation flow (creates account if needed)
- [ ] Role change capability (owner only)
- [ ] Remove team member capability (owner only, can't remove self)
- [ ] Pending invitations list

## Tech Notes
- Add `team_invitations` table for pending invites
- Invitation tokens expire after 7 days

## Dependencies
- DT-003: Database Schema - Auth & Subscribers
- DT-008: Dashboard Layout & Navigation
- DT-031: Email Service Integration

## Related Tickets
- DT-010: Page Settings Management
