# DT-039: Status API - Components Endpoint

## Epic
Epic 9: Public API (Status API)

## Description
Implement components listing endpoint.

## Acceptance Criteria
- [ ] `GET /api/v2/components.json` - all components with current status
- [ ] Response includes component groups
- [ ] Each component: id, name, status, description, group_id, position
- [ ] CORS enabled, cached (1 minute)

## Tech Notes
- Useful for building custom status displays

## Dependencies
- DT-004: Database Repository Layer
- DT-044: Subdomain Routing

## Related Tickets
- DT-035: Status API - Summary Endpoint
- DT-042: Manage API - Components CRUD
