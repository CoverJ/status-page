# DT-038: Public API - Maintenance Endpoints

**Epic:** Public API (Status API)
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-035

---

## Description

Implement the scheduled maintenance API endpoints for retrieving maintenance event data including upcoming, active, and all scheduled maintenance.

---

## Acceptance Criteria

- [ ] GET /api/v2/scheduled-maintenances.json - list all maintenance
- [ ] GET /api/v2/scheduled-maintenances/upcoming.json - list upcoming only
- [ ] GET /api/v2/scheduled-maintenances/active.json - list in-progress only
- [ ] GET /api/v2/scheduled-maintenances/{id}.json - get single maintenance
- [ ] Pagination support
- [ ] Include maintenance updates
- [ ] Include affected components
- [ ] CORS headers for public access
- [ ] Edge caching with appropriate TTL

---

## Technical Notes

### All Maintenance Endpoint
```typescript
// src/pages/api/v2/scheduled-maintenances.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatMaintenance, formatUpdates } from '@/lib/api/formatters';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(context.url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(context.url.searchParams.get('per_page') || '25')));
  const offset = (pageNum - 1) * perPage;

  // Fetch all maintenance events
  const maintenances = await IncidentRepository.findAllMaintenance(db, page.id, {
    limit: perPage,
    offset,
  });

  // Fetch updates and affected components for each
  const maintenancesWithDetails = await Promise.all(
    maintenances.map(async (maintenance) => {
      const [updates, affectedComponents] = await Promise.all([
        IncidentUpdateRepository.findByIncidentId(db, maintenance.id),
        IncidentComponentRepository.findByIncidentId(db, maintenance.id),
      ]);

      return {
        ...formatMaintenance(maintenance),
        incident_updates: formatUpdates(updates),
        components: affectedComponents.map(c => ({
          id: c.componentId,
          name: c.componentName,
        })),
      };
    })
  );

  return new Response(JSON.stringify({
    page: pageNum,
    per_page: perPage,
    scheduled_maintenances: maintenancesWithDetails,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
```

### Upcoming Maintenance Endpoint
```typescript
// src/pages/api/v2/scheduled-maintenances/upcoming.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatMaintenance, formatUpdates } from '@/lib/api/formatters';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch scheduled (not yet started) maintenance
  const maintenances = await IncidentRepository.findScheduled(db, page.id);

  // Fetch updates and affected components
  const maintenancesWithDetails = await Promise.all(
    maintenances.map(async (maintenance) => {
      const [updates, affectedComponents] = await Promise.all([
        IncidentUpdateRepository.findByIncidentId(db, maintenance.id),
        IncidentComponentRepository.findByIncidentId(db, maintenance.id),
      ]);

      return {
        ...formatMaintenance(maintenance),
        incident_updates: formatUpdates(updates),
        components: affectedComponents.map(c => ({
          id: c.componentId,
          name: c.componentName,
        })),
      };
    })
  );

  return new Response(JSON.stringify({
    scheduled_maintenances: maintenancesWithDetails,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
```

### Active Maintenance Endpoint
```typescript
// src/pages/api/v2/scheduled-maintenances/active.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatMaintenance, formatUpdates } from '@/lib/api/formatters';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch in-progress maintenance
  const maintenances = await IncidentRepository.findInProgressMaintenance(db, page.id);

  // Fetch updates and affected components
  const maintenancesWithDetails = await Promise.all(
    maintenances.map(async (maintenance) => {
      const [updates, affectedComponents] = await Promise.all([
        IncidentUpdateRepository.findByIncidentId(db, maintenance.id),
        IncidentComponentRepository.findByIncidentId(db, maintenance.id),
      ]);

      return {
        ...formatMaintenance(maintenance),
        incident_updates: formatUpdates(updates),
        components: affectedComponents.map(c => ({
          id: c.componentId,
          name: c.componentName,
        })),
      };
    })
  );

  return new Response(JSON.stringify({
    scheduled_maintenances: maintenancesWithDetails,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
```

### Single Maintenance Endpoint
```typescript
// src/pages/api/v2/scheduled-maintenances/[id].json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatMaintenance, formatUpdates } from '@/lib/api/formatters';

export const GET: APIRoute = async (context) => {
  const { id } = context.params;
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch maintenance
  const maintenance = await IncidentRepository.findById(db, id);

  // Verify it's a maintenance event belonging to this page
  if (!maintenance || maintenance.pageId !== page.id || !maintenance.scheduledFor) {
    return new Response(JSON.stringify({ error: 'Scheduled maintenance not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch updates and affected components
  const [updates, affectedComponents] = await Promise.all([
    IncidentUpdateRepository.findByIncidentId(db, maintenance.id),
    IncidentComponentRepository.findByIncidentId(db, maintenance.id),
  ]);

  const response = {
    ...formatMaintenance(maintenance),
    incident_updates: formatUpdates(updates),
    components: affectedComponents.map(c => ({
      id: c.componentId,
      name: c.componentName,
    })),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};
```

### Example Response
```json
// GET /api/v2/scheduled-maintenances/upcoming.json
{
  "scheduled_maintenances": [
    {
      "id": "maint123",
      "name": "Database Migration",
      "status": "scheduled",
      "impact": "maintenance",
      "scheduled_for": "2024-01-20T02:00:00Z",
      "scheduled_until": "2024-01-20T06:00:00Z",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "incident_updates": [
        {
          "id": "upd1",
          "status": "scheduled",
          "body": "We will be performing a scheduled database migration. During this time, the API may experience brief interruptions.",
          "display_at": "2024-01-15T10:00:00Z"
        }
      ],
      "components": [
        {
          "id": "comp1",
          "name": "API"
        },
        {
          "id": "comp2",
          "name": "Database"
        }
      ]
    }
  ]
}
```

### Repository Additions
```typescript
// src/db/repositories/incidents.ts (additions)
export const IncidentRepository = {
  // ... existing methods

  async findAllMaintenance(db: Database, pageId: string, options?: { limit?: number; offset?: number }) {
    return db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.pageId, pageId),
        isNotNull(incidents.scheduledFor)
      ))
      .orderBy(desc(incidents.scheduledFor))
      .limit(options?.limit ?? 25)
      .offset(options?.offset ?? 0)
      .all();
  },

  async findInProgressMaintenance(db: Database, pageId: string) {
    return db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.pageId, pageId),
        isNotNull(incidents.scheduledFor),
        inArray(incidents.status, ['in_progress', 'verifying'])
      ))
      .orderBy(incidents.scheduledFor)
      .all();
  },
};
```

---

## Testing

- [ ] All maintenance listed correctly
- [ ] Upcoming filters to scheduled only
- [ ] Active filters to in-progress only
- [ ] Single maintenance retrieval works
- [ ] 404 for non-existent maintenance
- [ ] 404 for incident ID (not maintenance)
- [ ] Maintenance updates included
- [ ] Affected components included
- [ ] Pagination works correctly
- [ ] CORS headers present
- [ ] Cache headers present

---

## Files to Create/Modify

- `src/pages/api/v2/scheduled-maintenances.json.ts`
- `src/pages/api/v2/scheduled-maintenances/upcoming.json.ts`
- `src/pages/api/v2/scheduled-maintenances/active.json.ts`
- `src/pages/api/v2/scheduled-maintenances/[id].json.ts`
- `src/db/repositories/incidents.ts` (add maintenance queries)
