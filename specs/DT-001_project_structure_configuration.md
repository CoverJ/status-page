# DT-001: Project Structure & Configuration

## Epic
Epic 1: Foundation & Infrastructure

## Description
Set up the foundational project structure, TypeScript configuration, and development tooling.

## Acceptance Criteria
- [ ] TypeScript strict mode enabled
- [ ] Biome configured for linting and formatting (`pnpm lint` and `pnpm lint:fix`)
- [ ] Path aliases configured (`@/` for src)
- [ ] Environment variable schema defined (using zod)
- [ ] Development, staging, and production Cloudflare environments configured
- [ ] Basic folder structure: `src/pages`, `src/components`, `src/lib`, `src/db`, `src/api`

## Tech Notes
- Astro config should enable SSR with Cloudflare adapter
- Use `wrangler.toml` for D1, KV, and Queue bindings

## Dependencies
None (foundational ticket)

## Testing/QA
Follow the "wrap it up" process:
1. Run `pnpm run lint:fix`
2. Run `pnpm run test:all`
3. Run `pnpm build`
4. Run `pnpm deploy`
5. Commit and push changes

## Related Tickets
- DT-002: Database Schema - Core Entities
- DT-003: Database Schema - Auth & Subscribers
- DT-004: Database Repository Layer
