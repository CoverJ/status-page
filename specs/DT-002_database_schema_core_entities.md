# DT-002: Database Schema - Core Entities

## Epic
Epic 1: Foundation & Infrastructure

## Description
Define and implement the Drizzle ORM schema for all core entities.

## Acceptance Criteria
- [ ] `pages` table with all attributes from spec (page_id, name, subdomain, custom_domain, status_indicator, status_description, created_at, updated_at)
- [ ] `components` table (component_id, page_id, name, description, status, position, showcase, created_at, updated_at)
- [ ] `component_groups` table (group_id, page_id, name, position, created_at, updated_at)
- [ ] `incidents` table (incident_id, page_id, name, status, impact, scheduled_for, scheduled_until, created_at, updated_at, resolved_at)
- [ ] `incident_updates` table (update_id, incident_id, status, body, display_at, created_at)
- [ ] `incident_components` junction table (incident_id, component_id, old_status, new_status)
- [ ] Foreign key constraints and indexes defined
- [ ] Migration files generated and tested locally

## Tech Notes
- Use Drizzle with D1 adapter
- UUIDs generated via `crypto.randomUUID()`
- Timestamps stored as ISO strings (D1 limitation)

## Dependencies
- DT-001: Project Structure & Configuration

## Related Tickets
- DT-003: Database Schema - Auth & Subscribers
- DT-004: Database Repository Layer
