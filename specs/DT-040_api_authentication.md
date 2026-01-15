# DT-040: API Authentication

## Epic
Epic 10: Manage API (Authenticated)

## Description
Implement API key authentication for the manage API.

## Acceptance Criteria
- [ ] API keys stored in `api_keys` table (key_hash, page_id, name, created_at, last_used_at)
- [ ] Key format: `dt_live_xxxx` (prefix + 32 random chars)
- [ ] Key validated via Authorization header: `Bearer dt_live_xxxx`
- [ ] Rate limiting: 60 requests per minute per key
- [ ] Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] API key management UI in dashboard

## Tech Notes
- Store hash of key, not plaintext (show key only on creation)
- Rate limiting via KV (sliding window)

## Dependencies
- DT-002: Database Schema - Core Entities
- DT-008: Dashboard Layout & Navigation

## Related Tickets
- DT-007: Auth Middleware & Guards
- DT-041: Manage API - Incidents CRUD
