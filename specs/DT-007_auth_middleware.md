# DT-007: Auth Middleware & Guards

**Epic:** Authentication System
**Priority:** Critical
**Estimate:** Small
**Dependencies:** DT-005, DT-006

---

## Description

Create middleware for protecting routes and API endpoints, including session validation, page access control, and automatic session refresh.

---

## Acceptance Criteria

- [ ] `requireAuth` middleware validates session cookie
- [ ] `requirePageAccess` middleware checks team membership for a page
- [ ] `getCurrentUser` utility for accessing user in Astro pages
- [ ] Redirect to login for unauthenticated dashboard access
- [ ] 401 response for unauthenticated API access
- [ ] Session refresh on activity (extend expiry if >50% through)
- [ ] User and session attached to `Astro.locals`

---

## Technical Notes

### Astro Middleware
```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';
import { createDb, SessionRepository, UserRepository, TeamMemberRepository } from '@/db';
import { getSessionIdFromCookie, createSessionCookie } from '@/lib/auth/session';

const SESSION_REFRESH_THRESHOLD = 15; // days

// Auth middleware - validates session and attaches user
const authMiddleware = defineMiddleware(async ({ locals, cookies, request }, next) => {
  const db = createDb(locals.runtime.env.DB);
  const cookieHeader = request.headers.get('cookie');
  const sessionId = getSessionIdFromCookie(cookieHeader);

  if (sessionId) {
    const session = await SessionRepository.findValid(db, sessionId);

    if (session) {
      const user = await UserRepository.findById(db, session.userId);

      if (user) {
        locals.user = user;
        locals.session = session;

        // Refresh session if past threshold
        const expiresAt = new Date(session.expiresAt);
        const now = new Date();
        const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry < SESSION_REFRESH_THRESHOLD) {
          const newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + 30);
          await SessionRepository.extendExpiry(db, sessionId, newExpiresAt.toISOString());
          locals.refreshedSessionCookie = createSessionCookie(sessionId);
        }
      }
    }
  }

  const response = await next();

  // Add refreshed session cookie if needed
  if (locals.refreshedSessionCookie) {
    response.headers.append('Set-Cookie', locals.refreshedSessionCookie);
  }

  return response;
});

export const onRequest = sequence(authMiddleware);
```

### Route Guards
```typescript
// src/lib/auth/guards.ts
import type { AstroGlobal } from 'astro';
import { createDb, TeamMemberRepository } from '@/db';

export function requireAuth(Astro: AstroGlobal): Response | null {
  if (!Astro.locals.user) {
    // For API routes, return 401
    if (Astro.url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // For pages, redirect to login
    return Astro.redirect(`/auth/login?redirect=${encodeURIComponent(Astro.url.pathname)}`);
  }
  return null;
}

export async function requirePageAccess(
  Astro: AstroGlobal,
  pageId: string,
  requiredRoles?: ('owner' | 'admin' | 'member')[]
): Promise<Response | null> {
  const authResponse = requireAuth(Astro);
  if (authResponse) return authResponse;

  const db = createDb(Astro.locals.runtime.env.DB);
  const membership = await TeamMemberRepository.findByPageAndUser(
    db,
    pageId,
    Astro.locals.user!.id
  );

  if (!membership) {
    if (Astro.url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        error: { code: 'FORBIDDEN', message: 'Access denied to this page' }
      }), { status: 403 });
    }
    return Astro.redirect('/app?error=access_denied');
  }

  if (requiredRoles && !requiredRoles.includes(membership.role)) {
    if (Astro.url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      }), { status: 403 });
    }
    return Astro.redirect(`/app/${pageId}?error=insufficient_permissions`);
  }

  // Attach membership to locals for use in page
  Astro.locals.membership = membership;
  return null;
}

export function requireOwner(Astro: AstroGlobal, pageId: string) {
  return requirePageAccess(Astro, pageId, ['owner']);
}

export function requireAdmin(Astro: AstroGlobal, pageId: string) {
  return requirePageAccess(Astro, pageId, ['owner', 'admin']);
}
```

### Type Definitions
```typescript
// src/env.d.ts
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  EMAIL_QUEUE: Queue;
  APP_URL: string;
  SESSION_SECRET: string;
  RESEND_API_KEY: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: string;
      email: string;
      name: string | null;
      emailVerifiedAt: string | null;
    };
    session?: {
      id: string;
      userId: string;
      expiresAt: string;
    };
    membership?: {
      id: string;
      pageId: string;
      userId: string;
      role: 'owner' | 'admin' | 'member';
    };
    refreshedSessionCookie?: string;
  }
}
```

### Usage in Pages
```astro
// src/pages/app/[pageId]/index.astro
---
import { requirePageAccess } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';

const { pageId } = Astro.params;
const authResponse = await requirePageAccess(Astro, pageId);
if (authResponse) return authResponse;

const { user, membership } = Astro.locals;
---

<DashboardLayout pageId={pageId} user={user} role={membership.role}>
  <h1>Dashboard</h1>
</DashboardLayout>
```

### Usage in API Routes
```typescript
// src/pages/api/pages/[pageId]/components.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentRepository } from '@/db';

export const GET: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const components = await ComponentRepository.findByPageId(db, pageId);

  return new Response(JSON.stringify({ components }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## Testing

- [ ] Unauthenticated users redirected to login from dashboard pages
- [ ] Unauthenticated API requests receive 401
- [ ] Users without page access receive 403
- [ ] Users with insufficient role receive 403
- [ ] Session refreshed when past threshold
- [ ] User attached to `Astro.locals` after middleware
- [ ] Redirect includes original URL for post-login redirect

---

## Files to Create/Modify

- `src/middleware.ts`
- `src/lib/auth/guards.ts`
- `src/env.d.ts`
- `src/db/repositories/team-members.ts` (add findByPageAndUser)
