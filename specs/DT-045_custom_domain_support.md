# DT-045: Custom Domain Support (Basic)

## Epic
Epic 11: Subdomain Routing & Multi-tenancy

## Description
Allow pages to use custom domains.

## Acceptance Criteria
- [ ] Custom domain field in page settings
- [ ] Instructions displayed for DNS configuration (CNAME)
- [ ] Custom domain routing in worker
- [ ] SSL certificate via Cloudflare (automatic)
- [ ] Fallback to subdomain if custom domain not configured

## Tech Notes
- For MVP: manual Cloudflare dashboard setup required
- Future: Cloudflare for SaaS API for automated SSL

## Dependencies
- DT-044: Subdomain Routing
- DT-010: Page Settings Management

## Related Tickets
- DT-010: Page Settings Management
