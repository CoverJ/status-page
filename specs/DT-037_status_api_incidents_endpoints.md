# DT-037: Status API - Incidents Endpoints

## Epic
Epic 9: Public API (Status API)

## Description
Implement incident-related public endpoints.

## Acceptance Criteria
- [ ] `GET /api/v2/incidents.json` - all incidents (paginated, last 50)
- [ ] `GET /api/v2/incidents/unresolved.json` - active incidents only
- [ ] Each incident includes full update timeline
- [ ] Response includes affected component details
- [ ] CORS enabled, cached (1 minute)

## Tech Notes
- Pagination via `page` query param
- Include incident updates nested in response

## Dependencies
- DT-004: Database Repository Layer
- DT-044: Subdomain Routing

## Related Tickets
- DT-035: Status API - Summary Endpoint
- DT-038: Status API - Maintenance Endpoints
