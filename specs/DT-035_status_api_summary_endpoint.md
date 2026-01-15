# DT-035: Status API - Summary Endpoint

## Epic
Epic 9: Public API (Status API)

## Description
Implement the public summary.json endpoint.

## Acceptance Criteria
- [ ] `GET /api/v2/summary.json` returns full status summary
- [ ] Response includes: page info, status indicator, components, unresolved incidents, scheduled maintenances
- [ ] CORS enabled for public access
- [ ] Response cached at edge (1 minute TTL)
- [ ] Cache invalidated on status change

## Tech Notes
- Use Cloudflare Cache API for edge caching
- Structure matches spec section 5.3

## Dependencies
- DT-004: Database Repository Layer
- DT-044: Subdomain Routing

## Related Tickets
- DT-036: Status API - Status Endpoint
- DT-037: Status API - Incidents Endpoints
