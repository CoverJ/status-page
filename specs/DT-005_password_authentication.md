# DT-005: Password Authentication

## Epic
Epic 2: Authentication System

## Description
Implement secure password-based authentication.

## Acceptance Criteria
- [ ] Password hashing utility using PBKDF2 (100k iterations, SHA-256)
- [ ] Password verification utility
- [ ] Password strength validation (min 8 chars, complexity rules)
- [ ] Signup endpoint creates user with hashed password
- [ ] Login endpoint verifies password and creates session
- [ ] Session stored in HTTP-only cookie
- [ ] Logout endpoint destroys session

## Tech Notes
- Use Web Crypto API (available in Cloudflare Workers)
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`
- Session expiry: 30 days

## Dependencies
- DT-003: Database Schema - Auth & Subscribers
- DT-004: Database Repository Layer

## Related Tickets
- DT-006: Magic Link Authentication
- DT-007: Auth Middleware & Guards
