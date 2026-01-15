# DT-038: Status API - Maintenance Endpoints

## Epic
Epic 9: Public API (Status API)

## Description
Implement maintenance-related public endpoints.

## Acceptance Criteria
- [ ] `GET /api/v2/scheduled-maintenances.json` - all maintenance
- [ ] `GET /api/v2/scheduled-maintenances/upcoming.json` - scheduled, not started
- [ ] `GET /api/v2/scheduled-maintenances/active.json` - in_progress only
- [ ] Response includes scheduled times in ISO format
- [ ] CORS enabled, cached (1 minute)

## Tech Notes
- Maintenance is a subset of incidents with specific statuses

## Dependencies
- DT-004: Database Repository Layer
- DT-044: Subdomain Routing

## Related Tickets
- DT-037: Status API - Incidents Endpoints
