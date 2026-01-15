# DT-041: Manage API - Incidents CRUD

## Epic
Epic 10: Manage API (Authenticated)

## Description
Implement authenticated incident management endpoints.

## Acceptance Criteria
- [ ] `GET /api/v1/pages/{page_id}/incidents` - list incidents
- [ ] `POST /api/v1/pages/{page_id}/incidents` - create incident
- [ ] `GET /api/v1/pages/{page_id}/incidents/{id}` - get incident
- [ ] `PATCH /api/v1/pages/{page_id}/incidents/{id}` - update incident
- [ ] `DELETE /api/v1/pages/{page_id}/incidents/{id}` - delete incident
- [ ] POST body creates incident with initial update
- [ ] PATCH can add update via nested `incident_update` object

## Tech Notes
- Validate page_id matches API key's page
- Return 404 for incidents on other pages

## Dependencies
- DT-040: API Authentication
- DT-004: Database Repository Layer

## Related Tickets
- DT-042: Manage API - Components CRUD
- DT-017: Create Incident Flow
