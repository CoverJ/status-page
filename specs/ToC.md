# downtime.online - Development Tickets Table of Contents

## MVP Scope
- Public status pages only (no private/audience-specific)
- Email notifications only (via Resend)
- No third-party integrations
- Email/password + magic link authentication

---

## Epic 1: Foundation & Infrastructure

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-001](./DT-001_project_structure_configuration.md) | Project Structure & Configuration | Set up foundational project structure, TypeScript, ESLint, Prettier, and Cloudflare environments | ✅ |
| [DT-002](./DT-002_database_schema_core_entities.md) | Database Schema - Core Entities | Drizzle ORM schema for pages, components, component_groups, incidents, and incident_updates | ✅ |
| [DT-003](./DT-003_database_schema_auth_subscribers.md) | Database Schema - Auth & Subscribers | Schema for users, sessions, magic_links, team_members, and subscribers | ✅ |
| [DT-004](./DT-004_database_repository_layer.md) | Database Repository Layer | Type-safe repository functions for all database operations | ✅ |

---

## Epic 2: Authentication System

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-005](./DT-005_password_authentication.md) | Password Authentication | PBKDF2 password hashing, login/signup endpoints, session management | ✅ |
| [DT-006](./DT-006_magic_link_authentication.md) | Magic Link Authentication | Passwordless login via email with rate-limited, single-use tokens | |
| [DT-007](./DT-007_auth_middleware_guards.md) | Auth Middleware & Guards | Route protection middleware and session validation | ✅ |

---

## Epic 3: Admin Dashboard - Page Management

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-008](./DT-008_dashboard_layout_navigation.md) | Dashboard Layout & Navigation | Admin dashboard shell with sidebar navigation and responsive design | |
| [DT-009](./DT-009_page_creation_flow.md) | Page Creation Flow | Create new status pages with subdomain validation | |
| [DT-010](./DT-010_page_settings_management.md) | Page Settings Management | Configure page name, description, subdomain, and timezone | |
| [DT-011](./DT-011_team_member_management.md) | Team Member Management | Invite and manage team members with role-based access | |

---

## Epic 4: Admin Dashboard - Component Management

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-012](./DT-012_component_list_view.md) | Component List View | Display components grouped with status indicators and quick actions | |
| [DT-013](./DT-013_component_crud_operations.md) | Component CRUD Operations | Create, edit, and delete components with validation | |
| [DT-014](./DT-014_component_group_management.md) | Component Group Management | Create and manage component groups for organization | |
| [DT-015](./DT-015_component_drag_drop_reordering.md) | Component Drag-and-Drop Reordering | Reorder components and groups via drag-and-drop with @dnd-kit | |

---

## Epic 5: Admin Dashboard - Incident Management

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-016](./DT-016_incident_list_view.md) | Incident List View | Display active, scheduled, and resolved incidents with tabs | |
| [DT-017](./DT-017_create_incident_flow.md) | Create Incident Flow | Create incidents or scheduled maintenance with affected components | |
| [DT-018](./DT-018_incident_detail_update_view.md) | Incident Detail & Update View | View incident details and update timeline | |
| [DT-019](./DT-019_add_incident_update_flow.md) | Add Incident Update Flow | Post incident updates with status and component changes | |
| [DT-020](./DT-020_incident_templates.md) | Incident Templates | Create and use templates for faster incident creation | |

---

## Epic 6: Admin Dashboard - Subscriber Management

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-021](./DT-021_subscriber_list_view.md) | Subscriber List View | Display and filter subscribers with bulk actions | |
| [DT-022](./DT-022_manual_subscriber_management.md) | Manual Subscriber Management | Add, edit, and manage subscribers manually | |
| [DT-023](./DT-023_subscriber_import_export.md) | Subscriber Import/Export | Bulk import and export subscribers via CSV | |

---

## Epic 7: Public Status Page

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-024](./DT-024_status_page_layout_styling.md) | Status Page Layout & Styling | Public-facing status page layout with responsive design | ✅ |
| [DT-025](./DT-025_component_status_display.md) | Component Status Display | Display component statuses with uptime percentages | |
| [DT-026](./DT-026_active_incident_display.md) | Active Incident Display | Show current unresolved incidents with update timeline | |
| [DT-027](./DT-027_scheduled_maintenance_display.md) | Scheduled Maintenance Display | Show upcoming and in-progress maintenance windows | |
| [DT-028](./DT-028_incident_history_page.md) | Incident History Page | Historical incidents with calendar/list views and filtering | |
| [DT-029](./DT-029_subscriber_signup_flow.md) | Subscriber Signup Flow | Public subscription with double opt-in and component selection | |
| [DT-030](./DT-030_subscriber_preferences_unsubscribe.md) | Subscriber Preferences & Unsubscribe | Manage subscriptions and one-click unsubscribe | |

---

## Epic 8: Email Notifications

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-031](./DT-031_email_service_integration.md) | Email Service Integration | Resend SDK setup with retry logic and templates | |
| [DT-032](./DT-032_incident_notification_emails.md) | Incident Notification Emails | Send notifications for incident create/update/resolve | |
| [DT-033](./DT-033_maintenance_notification_emails.md) | Maintenance Notification Emails | Send maintenance reminders and status notifications | |
| [DT-034](./DT-034_email_delivery_tracking_quarantine.md) | Email Delivery Tracking & Quarantine | Track delivery, handle bounces, auto-quarantine failures | |

---

## Epic 9: Public API (Status API)

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-035](./DT-035_status_api_summary_endpoint.md) | Status API - Summary Endpoint | GET /api/v2/summary.json with full status summary | |
| [DT-036](./DT-036_status_api_status_endpoint.md) | Status API - Status Endpoint | GET /api/v2/status.json lightweight status check | |
| [DT-037](./DT-037_status_api_incidents_endpoints.md) | Status API - Incidents Endpoints | Public incident listing and unresolved incidents | |
| [DT-038](./DT-038_status_api_maintenance_endpoints.md) | Status API - Maintenance Endpoints | Scheduled maintenance listing endpoints | |
| [DT-039](./DT-039_status_api_components_endpoint.md) | Status API - Components Endpoint | GET /api/v2/components.json with current status | |

---

## Epic 10: Manage API (Authenticated)

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-040](./DT-040_api_authentication.md) | API Authentication | API key auth with rate limiting and management UI | |
| [DT-041](./DT-041_manage_api_incidents_crud.md) | Manage API - Incidents CRUD | Authenticated incident management endpoints | |
| [DT-042](./DT-042_manage_api_components_crud.md) | Manage API - Components CRUD | Authenticated component management endpoints | |
| [DT-043](./DT-043_manage_api_subscribers_crud.md) | Manage API - Subscribers CRUD | Authenticated subscriber management endpoints | |

---

## Epic 11: Subdomain Routing & Multi-tenancy

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-044](./DT-044_subdomain_routing.md) | Subdomain Routing | Route requests by subdomain with reserved subdomain handling | ✅ |
| [DT-045](./DT-045_custom_domain_support.md) | Custom Domain Support (Basic) | Custom domain configuration with Cloudflare SSL | |

---

## Epic 12: Polish & Production Readiness

| Ticket | Title | Description | Done |
|--------|-------|-------------|------|
| [DT-046](./DT-046_error_handling_logging.md) | Error Handling & Logging | Global error boundaries, structured logging, error tracking | |
| [DT-047](./DT-047_performance_optimization.md) | Performance Optimization | TTFB < 200ms, LCP < 1s, Lighthouse > 90 | |
| [DT-048](./DT-048_seo_meta_tags.md) | SEO & Meta Tags | Dynamic titles, Open Graph, meta descriptions | |
| [DT-049](./DT-049_accessibility_audit.md) | Accessibility Audit | WCAG 2.1 AA compliance and screen reader support | |
| [DT-050](./DT-050_security_hardening.md) | Security Hardening | Security headers, CSRF, input sanitization, rate limiting | |

---

## Dependency Graph

```
Epic 1 (Foundation)
    └── Epic 2 (Auth)
            └── Epic 3 (Page Management)
                    ├── Epic 4 (Components)
                    ├── Epic 5 (Incidents)
                    └── Epic 6 (Subscribers)
                            └── Epic 7 (Public Page)
                                    ├── Epic 8 (Notifications)
                                    ├── Epic 9 (Status API)
                                    └── Epic 10 (Manage API)
                                            └── Epic 11 (Multi-tenancy)
                                                    └── Epic 12 (Polish)
```

---

## Summary

| Epic | Tickets | Focus Area |
|------|---------|------------|
| 1. Foundation | DT-001 to DT-004 | Project setup, database schema, repositories |
| 2. Authentication | DT-005 to DT-007 | Password auth, magic links, middleware |
| 3. Page Management | DT-008 to DT-011 | Dashboard, page creation, settings, team |
| 4. Components | DT-012 to DT-015 | Component CRUD, groups, reordering |
| 5. Incidents | DT-016 to DT-020 | Incident CRUD, updates, templates |
| 6. Subscribers | DT-021 to DT-023 | Subscriber management, import/export |
| 7. Public Page | DT-024 to DT-030 | Status page UI, history, signup |
| 8. Notifications | DT-031 to DT-034 | Email sending, tracking |
| 9. Status API | DT-035 to DT-039 | Public read-only API |
| 10. Manage API | DT-040 to DT-043 | Authenticated management API |
| 11. Multi-tenancy | DT-044 to DT-045 | Subdomain routing, custom domains |
| 12. Polish | DT-046 to DT-050 | Errors, performance, security |

**Total: 50 tickets**

**Recommended order:** Epics 1-2 (foundation), then 3-6 (admin dashboard), then 7 (public page), then 8-10 (APIs/notifications), then 11-12 (production readiness).
