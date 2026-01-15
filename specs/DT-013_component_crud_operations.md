# DT-013: Component CRUD Operations

## Epic
Epic 4: Admin Dashboard - Component Management

## Description
Create, edit, and delete components.

## Acceptance Criteria
- [ ] Create component modal with name, description, group selection
- [ ] Edit component modal (same fields)
- [ ] Delete component with confirmation dialog
- [ ] Validation: name required, max 100 chars
- [ ] Component position auto-assigned on create
- [ ] Success/error toast notifications

## Tech Notes
- Soft delete consideration: may want to preserve for incident history
- For MVP, hard delete is acceptable

## Dependencies
- DT-004: Database Repository Layer
- DT-012: Component List View

## Related Tickets
- DT-014: Component Group Management
- DT-025: Component Status Display
