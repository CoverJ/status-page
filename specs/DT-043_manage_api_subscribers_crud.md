# DT-043: Manage API - Subscribers CRUD

## Epic
Epic 10: Manage API (Authenticated)

## Description
Implement authenticated subscriber management endpoints.

## Acceptance Criteria
- [ ] `GET /api/v1/pages/{page_id}/subscribers` - list subscribers (paginated)
- [ ] `POST /api/v1/pages/{page_id}/subscribers` - create subscriber
- [ ] `DELETE /api/v1/pages/{page_id}/subscribers/{id}` - remove subscriber
- [ ] Filter params: status, component_id
- [ ] Option to skip confirmation email on create

## Tech Notes
- No PATCH - subscribers manage their own preferences

## Dependencies
- DT-040: API Authentication
- DT-004: Database Repository Layer

## Related Tickets
- DT-023: Subscriber Import/Export
- DT-021: Subscriber List View
