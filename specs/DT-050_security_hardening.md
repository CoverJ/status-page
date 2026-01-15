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

## Testing/QA
Before completing this work item, follow the "wrap it up" process:
1. Run `pnpm run lint:fix` to lint and format code with Biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Create a git commit with a descriptive message
6. Push the changes

## Related Tickets
- DT-046: Error Handling & Logging
