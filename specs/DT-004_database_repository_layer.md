# DT-004: Database Repository Layer

## Epic
Epic 1: Foundation & Infrastructure

## Description
Create type-safe repository functions for database operations.

## Acceptance Criteria
- [ ] `PageRepository` with CRUD operations + findBySubdomain
- [ ] `ComponentRepository` with CRUD + findByPageId + reorder
- [ ] `ComponentGroupRepository` with CRUD + findByPageId
- [ ] `IncidentRepository` with CRUD + findByPageId + findUnresolved + findScheduled
- [ ] `IncidentUpdateRepository` with create + findByIncidentId
- [ ] `SubscriberRepository` with CRUD + findByPageId + findConfirmed
- [ ] `UserRepository` with CRUD + findByEmail
- [ ] `SessionRepository` with create + findValid + delete
- [ ] All repositories return typed results using Drizzle inference

## Tech Notes
- Repositories accept D1 database instance as parameter (for Cloudflare Workers context)
- Use Drizzle's `eq`, `and`, `desc` helpers for queries

## Dependencies
- DT-002: Database Schema - Core Entities
- DT-003: Database Schema - Auth & Subscribers

## Related Tickets
- DT-005: Password Authentication
- DT-012: Component List View
