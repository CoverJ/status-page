# DT-015: Component Drag-and-Drop Reordering

## Epic
Epic 4: Admin Dashboard - Component Management

## Description
Allow reordering components and groups via drag-and-drop.

## Acceptance Criteria
- [ ] Drag components to reorder within a group
- [ ] Drag components between groups
- [ ] Drag groups to reorder
- [ ] Order persisted to database on drop
- [ ] Visual feedback during drag
- [ ] Keyboard accessibility for reordering

## Tech Notes
- Use a lightweight DnD library (e.g., @dnd-kit)
- Batch position updates in single API call

## Dependencies
- DT-012: Component List View
- DT-013: Component CRUD Operations
- DT-014: Component Group Management

## Related Tickets
- DT-049: Accessibility Audit
