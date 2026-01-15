# DT-044: Subdomain Routing

## Epic
Epic 11: Subdomain Routing & Multi-tenancy

## Description
Route requests to correct page based on subdomain.

## Acceptance Criteria
- [ ] `{subdomain}.downtime.online` routes to that page's status page
- [ ] Unknown subdomains show 404 page
- [ ] Reserved subdomains: www, app, api, admin, status, mail
- [ ] Admin dashboard accessible at `app.downtime.online`
- [ ] API accessible at `api.downtime.online`

## Tech Notes
- Cloudflare Workers can access hostname
- Subdomain lookup via KV cache -> D1 fallback

## Dependencies
- DT-001: Project Structure & Configuration
- DT-004: Database Repository Layer

## Related Tickets
- DT-009: Page Creation Flow
- DT-045: Custom Domain Support
