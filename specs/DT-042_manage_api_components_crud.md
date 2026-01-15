# DT-042: Manage API - Components CRUD

## Epic
Epic 10: Manage API (Authenticated)

## Description
Implement authenticated component management endpoints.

## Acceptance Criteria
- [ ] `GET /api/v1/pages/{page_id}/components` - list components
- [ ] `POST /api/v1/pages/{page_id}/components` - create component
- [ ] `PATCH /api/v1/pages/{page_id}/components/{id}` - update component
- [ ] `DELETE /api/v1/pages/{page_id}/components/{id}` - delete component
- [ ] Status-only update shorthand: `PATCH` with just `{ status: "..." }`
- [ ] Bulk status update endpoint consideration

## Tech Notes
- Component status changes can trigger incidents (future enhancement)

## Dependencies
- DT-040: API Authentication
- DT-004: Database Repository Layer

## Related Tickets
- DT-041: Manage API - Incidents CRUD
- DT-039: Status API - Components Endpoint
