# DT-006: Magic Link Authentication

## Epic
Epic 2: Authentication System

## Description
Implement passwordless login via email magic links.

## Acceptance Criteria
- [ ] Magic link generation endpoint (creates token, sends email)
- [ ] Magic link verification endpoint (validates token, creates session)
- [ ] Token expiry: 15 minutes
- [ ] Single-use tokens (marked as used after verification)
- [ ] Rate limiting: max 5 magic link requests per email per hour
- [ ] Email template for magic link

## Tech Notes
- Store rate limit counts in Cloudflare KV
- Token: 32-byte random hex string

## Dependencies
- DT-003: Database Schema - Auth & Subscribers
- DT-004: Database Repository Layer
- DT-031: Email Service Integration

## Related Tickets
- DT-005: Password Authentication
- DT-007: Auth Middleware & Guards
