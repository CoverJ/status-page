# DT-050: Security Hardening

## Epic
Epic 12: Polish & Production Readiness

## Description
Implement security best practices.

## Acceptance Criteria
- [ ] Security headers: CSP, X-Frame-Options, X-Content-Type-Options
- [ ] CSRF protection on all forms
- [ ] Input sanitization on all user inputs
- [ ] SQL injection prevention (Drizzle parameterized queries)
- [ ] XSS prevention (React auto-escaping + CSP)
- [ ] Rate limiting on auth endpoints (login, signup, magic link)
- [ ] Secrets stored in Cloudflare secrets, not env vars

## Tech Notes
- Use Astro middleware for security headers
- Cloudflare WAF rules for additional protection

## Dependencies
- DT-001: Project Structure & Configuration
- DT-005: Password Authentication

## Related Tickets
- DT-046: Error Handling & Logging
