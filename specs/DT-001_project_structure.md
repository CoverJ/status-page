# DT-001: Project Structure & Configuration

**Epic:** Foundation & Infrastructure
**Priority:** Critical
**Estimate:** Small
**Dependencies:** None

---

## Description

Set up the foundational project structure, TypeScript configuration, and development tooling for the downtime.online platform.

---

## Acceptance Criteria

- [ ] TypeScript strict mode enabled
- [ ] ESLint and Prettier configured with consistent rules
- [ ] Path aliases configured (`@/` for src)
- [ ] Environment variable schema defined using Zod
- [ ] Development, staging, and production Cloudflare environments configured in `wrangler.toml`
- [ ] Basic folder structure created:
  - `src/pages/` - Astro pages
  - `src/components/` - React/Astro components
  - `src/lib/` - Shared utilities
  - `src/db/` - Drizzle schema and repositories
  - `src/api/` - API route handlers

---

## Technical Notes

### Astro Configuration
```typescript
// astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    runtime: {
      mode: 'local',
      type: 'pages',
    },
  }),
});
```

### Wrangler Bindings
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "downtime-db"
database_id = "<id>"

[[kv_namespaces]]
binding = "KV"
id = "<id>"

[[queues.producers]]
binding = "EMAIL_QUEUE"
queue = "email-notifications"
```

### Environment Schema
```typescript
// src/lib/env.ts
import { z } from 'zod';

export const envSchema = z.object({
  RESEND_API_KEY: z.string(),
  APP_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
});
```

### Folder Structure
```
src/
├── pages/
│   ├── index.astro
│   ├── app/           # Dashboard pages
│   └── api/           # API routes
├── components/
│   ├── ui/            # Base UI components
│   ├── dashboard/     # Dashboard-specific
│   └── status/        # Public page components
├── lib/
│   ├── auth/          # Auth utilities
│   ├── email/         # Email utilities
│   └── utils/         # General utilities
└── db/
    ├── schema/        # Drizzle schema files
    ├── repositories/  # Data access layer
    └── migrations/    # Generated migrations
```

---

## Testing

- [ ] `npm run dev` starts local development server
- [ ] `npm run build` completes without errors
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Environment variables validated on startup

---

## Files to Create/Modify

- `astro.config.mjs`
- `tsconfig.json`
- `wrangler.toml`
- `.eslintrc.cjs`
- `.prettierrc`
- `src/lib/env.ts`
- `src/env.d.ts` (Cloudflare bindings types)
