# DT-020: Incident Templates

## Epic
Epic 5: Admin Dashboard - Incident Management

## Description
Create and use templates for faster incident creation.

## Acceptance Criteria
- [ ] Template management UI in settings
- [ ] Template fields: name pattern, default impact, default message, default components
- [ ] "Use Template" dropdown on incident creation
- [ ] Template populates form fields (editable before submit)
- [ ] CRUD operations for templates
- [ ] At least 3 starter templates provided for new pages

## Tech Notes
- Add `incident_templates` table
- Starter templates: "Service Degradation", "Service Outage", "Scheduled Maintenance"

## Dependencies
- DT-002: Database Schema - Core Entities
- DT-017: Create Incident Flow

## Related Tickets
- DT-010: Page Settings Management
