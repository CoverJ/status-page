# DT-035: Public API - Summary Endpoint

**Epic:** Public API (Status API)
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004, DT-024

---

## Description

Implement the /api/v2/summary.json endpoint providing a complete summary of the status page including overall status, components, incidents, and maintenance in a Statuspage-compatible format.

---

## Acceptance Criteria

- [ ] GET /api/v2/summary.json returns full status summary
- [ ] Response includes page information
- [ ] Response includes overall status indicator
- [ ] Response includes all components with status
- [ ] Response includes active incidents with updates
- [ ] Response includes scheduled maintenance
- [ ] CORS headers for public access
- [ ] Edge caching with appropriate TTL
- [ ] Response matches Statuspage API format

---

## Technical Notes

### Summary Endpoint
```typescript
// src/pages/api/v2/summary.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, ComponentRepository, IncidentRepository, IncidentUpdateRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  // Determine page from subdomain or query param
  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({
      error: 'Page not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fetch all data in parallel
  const [components, activeIncidents, scheduledMaintenance] = await Promise.all([
    ComponentRepository.findByPageId(db, page.id),
    IncidentRepository.findUnresolved(db, page.id),
    IncidentRepository.findScheduled(db, page.id),
  ]);

  // Fetch updates for incidents
  const incidentsWithUpdates = await Promise.all(
    activeIncidents.map(async (incident) => {
      const updates = await IncidentUpdateRepository.findByIncidentId(db, incident.id);
      return { ...incident, incident_updates: formatUpdates(updates) };
    })
  );

  const maintenanceWithUpdates = await Promise.all(
    scheduledMaintenance.map(async (maintenance) => {
      const updates = await IncidentUpdateRepository.findByIncidentId(db, maintenance.id);
      return { ...maintenance, incident_updates: formatUpdates(updates) };
    })
  );

  const response = {
    page: formatPage(page),
    status: formatStatus(page),
    components: components.map(formatComponent),
    incidents: incidentsWithUpdates.map(formatIncident),
    scheduled_maintenances: maintenanceWithUpdates.map(formatMaintenance),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
```

### Response Formatters
```typescript
// src/lib/api/formatters.ts

export function formatPage(page: Page) {
  return {
    id: page.id,
    name: page.name,
    url: `https://${page.subdomain}.downtime.online`,
    time_zone: page.timezone || 'UTC',
    updated_at: page.updatedAt,
  };
}

export function formatStatus(page: Page) {
  const indicators = {
    none: { indicator: 'none', description: 'All Systems Operational' },
    minor: { indicator: 'minor', description: 'Minor System Outage' },
    major: { indicator: 'major', description: 'Partial System Outage' },
    critical: { indicator: 'critical', description: 'Major System Outage' },
  };

  return indicators[page.statusIndicator] || indicators.none;
}

export function formatComponent(component: Component) {
  return {
    id: component.id,
    name: component.name,
    description: component.description,
    status: component.status,
    position: component.sortOrder,
    showcase: component.showcase,
    group_id: component.groupId,
    only_show_if_degraded: component.onlyShowIfDegraded || false,
    created_at: component.createdAt,
    updated_at: component.updatedAt,
  };
}

export function formatIncident(incident: IncidentWithUpdates) {
  return {
    id: incident.id,
    name: incident.name,
    status: incident.status,
    impact: incident.impact,
    created_at: incident.createdAt,
    updated_at: incident.updatedAt,
    monitoring_at: incident.monitoringAt,
    resolved_at: incident.resolvedAt,
    shortlink: `https://stspg.io/${incident.shortcode || incident.id.slice(0, 8)}`,
    incident_updates: incident.incident_updates,
  };
}

export function formatMaintenance(maintenance: MaintenanceWithUpdates) {
  return {
    id: maintenance.id,
    name: maintenance.name,
    status: maintenance.status,
    impact: 'maintenance',
    created_at: maintenance.createdAt,
    updated_at: maintenance.updatedAt,
    scheduled_for: maintenance.scheduledFor,
    scheduled_until: maintenance.scheduledUntil,
    incident_updates: maintenance.incident_updates,
  };
}

export function formatUpdates(updates: IncidentUpdate[]) {
  return updates.map(update => ({
    id: update.id,
    status: update.status,
    body: update.body,
    created_at: update.createdAt,
    updated_at: update.updatedAt,
    display_at: update.displayAt,
  }));
}
```

### Page Resolution Utility
```typescript
// src/lib/api/utils.ts
import type { APIContext } from 'astro';
import { PageRepository } from '@/db';
import type { Database } from '@/db/repositories/types';

export async function getPageFromRequest(
  context: APIContext,
  db: Database
): Promise<Page | null> {
  // Try subdomain from host header
  const host = context.request.headers.get('host') || '';
  const subdomainMatch = host.match(/^([^.]+)\.downtime\.online/);

  if (subdomainMatch) {
    return PageRepository.findBySubdomain(db, subdomainMatch[1]);
  }

  // Try page_id query param
  const pageId = context.url.searchParams.get('page_id');
  if (pageId) {
    return PageRepository.findById(db, pageId);
  }

  // Try subdomain query param
  const subdomain = context.url.searchParams.get('subdomain');
  if (subdomain) {
    return PageRepository.findBySubdomain(db, subdomain);
  }

  return null;
}
```

### Example Response
```json
{
  "page": {
    "id": "abc123",
    "name": "Acme Corp",
    "url": "https://acme.downtime.online",
    "time_zone": "America/New_York",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "status": {
    "indicator": "none",
    "description": "All Systems Operational"
  },
  "components": [
    {
      "id": "comp1",
      "name": "API",
      "description": "Core API endpoints",
      "status": "operational",
      "position": 1,
      "showcase": true,
      "group_id": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "incidents": [],
  "scheduled_maintenances": [
    {
      "id": "maint1",
      "name": "Database Upgrade",
      "status": "scheduled",
      "impact": "maintenance",
      "scheduled_for": "2024-01-20T02:00:00Z",
      "scheduled_until": "2024-01-20T04:00:00Z",
      "incident_updates": [
        {
          "id": "upd1",
          "status": "scheduled",
          "body": "We will be performing a database upgrade...",
          "display_at": "2024-01-15T10:00:00Z"
        }
      ]
    }
  ]
}
```

---

## Testing

- [ ] Endpoint returns valid JSON
- [ ] Page info included correctly
- [ ] Status indicator reflects page state
- [ ] Components listed with all fields
- [ ] Active incidents included
- [ ] Scheduled maintenance included
- [ ] Incident updates nested correctly
- [ ] CORS headers present
- [ ] Cache headers present
- [ ] 404 for unknown page
- [ ] OPTIONS request handled

---

## Files to Create/Modify

- `src/pages/api/v2/summary.json.ts`
- `src/lib/api/formatters.ts`
- `src/lib/api/utils.ts`
