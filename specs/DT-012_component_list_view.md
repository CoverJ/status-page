# DT-012: Component List View

## Epic
Epic 4: Admin Dashboard - Component Management

## Description
Display and manage components for a status page.

## Acceptance Criteria
- [ ] List all components grouped by component group
- [ ] Ungrouped components shown separately
- [ ] Display component name, current status, and status indicator color
- [ ] Quick status change dropdown on each component
- [ ] Add component button
- [ ] Add group button
- [ ] Empty state for pages with no components

## Tech Notes
- Color mapping: operational=green, degraded=yellow, partial=orange, major=red, maintenance=blue

## Dependencies
- DT-004: Database Repository Layer
- DT-008: Dashboard Layout & Navigation

## Related Tickets
- DT-013: Component CRUD Operations
- DT-014: Component Group Management
- DT-015: Component Drag-and-Drop Reordering
