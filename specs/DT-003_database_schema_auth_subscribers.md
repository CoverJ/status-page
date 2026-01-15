# DT-003: Database Schema - Auth & Subscribers

## Epic
Epic 1: Foundation & Infrastructure

## Description
Define schema for authentication and subscriber management.

## Acceptance Criteria
- [ ] `users` table (user_id, email, password_hash, name, created_at, updated_at, last_login_at)
- [ ] `sessions` table (session_id, user_id, expires_at, created_at)
- [ ] `magic_links` table (token, user_id, expires_at, used_at, created_at)
- [ ] `team_members` table (team_member_id, page_id, user_id, role, created_at)
- [ ] `subscribers` table (subscriber_id, page_id, email, component_ids, confirmed_at, quarantined_at, unsubscribed_at, created_at)
- [ ] `subscriber_confirmations` table (token, subscriber_id, expires_at, created_at)
- [ ] Indexes on email fields and foreign keys

## Tech Notes
- Passwords hashed using Web Crypto API (PBKDF2)
- Role enum: 'owner', 'admin', 'member'

## Dependencies
- DT-001: Project Structure & Configuration
- DT-002: Database Schema - Core Entities

## Related Tickets
- DT-004: Database Repository Layer
- DT-005: Password Authentication
