# DT-037: Public API - Incidents Endpoints

**Epic:** Public API (Status API)
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-035

---

## Description

Implement the incidents API endpoints for retrieving incident data including unresolved incidents, all incidents, and individual incident details.

---

## Acceptance Criteria

- [ ] GET /api/v2/incidents.json - list all incidents
- [ ] GET /api/v2/incidents/unresolved.json - list unresolved incidents
- [ ] GET /api/v2/incidents/{id}.json - get single incident
- [ ] Pagination support (page, per_page params)
- [ ] Include incident updates in responses
- [ ] Include affected components
- [ ] CORS headers for public access
- [ ] Edge caching with appropriate TTL

---

## Technical Notes

### Incidents List Endpoint
```typescript
// src/pages/api/v2/incidents.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatIncident, formatUpdates } from '@/lib/api/formatters';

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

  // Fetch incidents (excluding scheduled maintenance)
  const incidents = await IncidentRepository.findIncidents(db, page.id, {
    limit: perPage,
    offset,
  });

  // Fetch updates and affected components for each incident
  const incidentsWithDetails = await Promise.all(
    incidents.map(async (incident) => {
      const [updates, affectedComponents] = await Promise.all([
        IncidentUpdateRepository.findByIncidentId(db, incident.id),
        IncidentComponentRepository.findByIncidentId(db, incident.id),
      ]);

      return {
        ...formatIncident(incident),
        incident_updates: formatUpdates(updates),
        components: affectedComponents.map(c => ({
          id: c.componentId,
          name: c.componentName,
          old_status: c.oldStatus,
          new_status: c.newStatus,
        })),
      };
    })
  );

  return new Response(JSON.stringify({
    page: pageNum,
    per_page: perPage,
    incidents: incidentsWithDetails,
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

### Unresolved Incidents Endpoint
```typescript
// src/pages/api/v2/incidents/unresolved.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatIncident, formatUpdates } from '@/lib/api/formatters';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch unresolved incidents only
  const incidents = await IncidentRepository.findUnresolved(db, page.id);

  // Fetch updates and affected components for each incident
  const incidentsWithDetails = await Promise.all(
    incidents.map(async (incident) => {
      const [updates, affectedComponents] = await Promise.all([
        IncidentUpdateRepository.findByIncidentId(db, incident.id),
        IncidentComponentRepository.findByIncidentId(db, incident.id),
      ]);

      return {
        ...formatIncident(incident),
        incident_updates: formatUpdates(updates),
        components: affectedComponents.map(c => ({
          id: c.componentId,
          name: c.componentName,
          old_status: c.oldStatus,
          new_status: c.newStatus,
        })),
      };
    })
  );

  return new Response(JSON.stringify({
    incidents: incidentsWithDetails,
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

### Single Incident Endpoint
```typescript
// src/pages/api/v2/incidents/[id].json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, IncidentRepository, IncidentUpdateRepository, IncidentComponentRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatIncident, formatUpdates } from '@/lib/api/formatters';

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

  // Fetch incident
  const incident = await IncidentRepository.findById(db, id);

  if (!incident || incident.pageId !== page.id) {
    return new Response(JSON.stringify({ error: 'Incident not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Don't expose scheduled maintenance through incidents endpoint
  if (incident.scheduledFor) {
    return new Response(JSON.stringify({ error: 'Incident not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch updates and affected components
  const [updates, affectedComponents] = await Promise.all([
    IncidentUpdateRepository.findByIncidentId(db, incident.id),
    IncidentComponentRepository.findByIncidentId(db, incident.id),
  ]);

  const response = {
    ...formatIncident(incident),
    incident_updates: formatUpdates(updates),
    components: affectedComponents.map(c => ({
      id: c.componentId,
      name: c.componentName,
      old_status: c.oldStatus,
      new_status: c.newStatus,
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

### Example Responses
```json
// GET /api/v2/incidents.json
{
  "page": 1,
  "per_page": 25,
  "incidents": [
    {
      "id": "inc123",
      "name": "API Performance Degradation",
      "status": "resolved",
      "impact": "minor",
      "created_at": "2024-01-15T08:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "resolved_at": "2024-01-15T10:30:00Z",
      "incident_updates": [
        {
          "id": "upd1",
          "status": "resolved",
          "body": "The issue has been resolved.",
          "display_at": "2024-01-15T10:30:00Z"
        },
        {
          "id": "upd2",
          "status": "investigating",
          "body": "We are investigating elevated API response times.",
          "display_at": "2024-01-15T08:00:00Z"
        }
      ],
      "components": [
        {
          "id": "comp1",
          "name": "API",
          "old_status": "operational",
          "new_status": "degraded_performance"
        }
      ]
    }
  ]
}

// GET /api/v2/incidents/unresolved.json
{
  "incidents": []
}
```

---

## Testing

- [ ] incidents.json lists all incidents
- [ ] Pagination works correctly
- [ ] unresolved.json filters correctly
- [ ] Single incident retrieval works
- [ ] 404 for non-existent incident
- [ ] Incident updates included
- [ ] Affected components included
- [ ] Maintenance excluded from incidents
- [ ] CORS headers present
- [ ] Cache headers present

---

## Files to Create/Modify

- `src/pages/api/v2/incidents.json.ts`
- `src/pages/api/v2/incidents/unresolved.json.ts`
- `src/pages/api/v2/incidents/[id].json.ts`
- `src/db/repositories/incidents.ts` (add findIncidents filter)
