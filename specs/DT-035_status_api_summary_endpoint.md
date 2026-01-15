# DT-035: Status API - Summary Endpoint

## Epic
Epic 9: Public API (Status API)

## Description
Implement the public summary.json endpoint.

## Acceptance Criteria
- [ ] `GET /api/v2/summary.json` returns full status summary
- [ ] Response includes: page info, status indicator, components, unresolved incidents, scheduled maintenances
- [ ] CORS enabled for public access
- [ ] Response cached at edge (1 minute TTL)
- [ ] Cache invalidated on status change

## Tech Notes
- Use Cloudflare Cache API for edge caching
- Structure matches spec section 5.3

## Dependencies
- DT-004: Database Repository Layer
- DT-044: Subdomain Routing

## Related Tickets
- DT-036: Status API - Status Endpoint
- DT-037: Status API - Incidents Endpoints

## Testing/QA
Follow the "wrap it up" process before completing this ticket:
1. Run `pnpm run lint:fix` to lint and format code with Biome
2. Run `pnpm run test:all` to execute unit and E2E tests
3. Run `pnpm build` to verify the build succeeds
4. Run `pnpm deploy` to deploy to Cloudflare
5. Commit changes with a descriptive message and push
