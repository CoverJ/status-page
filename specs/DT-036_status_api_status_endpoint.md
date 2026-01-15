# DT-036: Status API - Status Endpoint

## Epic
Epic 9: Public API (Status API)

## Description
Implement the lightweight status.json endpoint.

## Acceptance Criteria
- [ ] `GET /api/v2/status.json` returns overall status only
- [ ] Response: `{ indicator: "none|minor|major|critical", description: "..." }`
- [ ] Indicator computed from worst component status
- [ ] Sub-second response time
- [ ] CORS enabled

## Tech Notes
- Lightest endpoint for health checks and widgets
- Heavy caching (1 minute TTL)

## Dependencies
- DT-004: Database Repository Layer
- DT-044: Subdomain Routing

## Related Tickets
- DT-035: Status API - Summary Endpoint
