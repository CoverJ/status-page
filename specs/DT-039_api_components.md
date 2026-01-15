# DT-039: Public API - Components Endpoint

**Epic:** Public API (Status API)
**Priority:** High
**Estimate:** Small
**Dependencies:** DT-035

---

## Description

Implement the components API endpoint for retrieving component information including status, groups, and uptime data.

---

## Acceptance Criteria

- [ ] GET /api/v2/components.json - list all components
- [ ] GET /api/v2/components/{id}.json - get single component
- [ ] Include component groups in response
- [ ] Include uptime data for showcase components
- [ ] Sort by display order
- [ ] CORS headers for public access
- [ ] Edge caching with appropriate TTL

---

## Technical Notes

### Components List Endpoint
```typescript
// src/pages/api/v2/components.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, ComponentRepository, ComponentGroupRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatComponent } from '@/lib/api/formatters';
import { calculateUptime } from '@/lib/utils/uptime';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch components and groups
  const [components, groups] = await Promise.all([
    ComponentRepository.findByPageId(db, page.id),
    ComponentGroupRepository.findByPageId(db, page.id),
  ]);

  // Calculate uptime for showcase components
  const showcaseComponentIds = components
    .filter(c => c.showcase)
    .map(c => c.id);

  const uptimeData = showcaseComponentIds.length > 0
    ? await calculateUptime(db, page.id, showcaseComponentIds, 90)
    : {};

  // Format components with uptime
  const formattedComponents = components.map(component => ({
    ...formatComponent(component),
    uptime_percentage: component.showcase ? uptimeData[component.id] : undefined,
  }));

  // Format groups
  const formattedGroups = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    position: group.sortOrder,
    created_at: group.createdAt,
    updated_at: group.updatedAt,
    components: formattedComponents.filter(c => c.group_id === group.id),
  }));

  return new Response(JSON.stringify({
    components: formattedComponents,
    groups: formattedGroups,
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

### Single Component Endpoint
```typescript
// src/pages/api/v2/components/[id].json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, ComponentRepository, ComponentGroupRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatComponent } from '@/lib/api/formatters';
import { calculateUptime } from '@/lib/utils/uptime';

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

  // Fetch component
  const component = await ComponentRepository.findById(db, id);

  if (!component || component.pageId !== page.id) {
    return new Response(JSON.stringify({ error: 'Component not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch group if applicable
  let group = null;
  if (component.groupId) {
    group = await ComponentGroupRepository.findById(db, component.groupId);
  }

  // Calculate uptime if showcase
  let uptimePercentage: number | undefined;
  if (component.showcase) {
    const uptimeData = await calculateUptime(db, page.id, [component.id], 90);
    uptimePercentage = uptimeData[component.id];
  }

  const response = {
    ...formatComponent(component),
    uptime_percentage: uptimePercentage,
    group: group ? {
      id: group.id,
      name: group.name,
    } : null,
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
// GET /api/v2/components.json
{
  "components": [
    {
      "id": "comp1",
      "name": "API",
      "description": "Core API endpoints",
      "status": "operational",
      "position": 1,
      "showcase": true,
      "group_id": null,
      "only_show_if_degraded": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "uptime_percentage": 99.98
    },
    {
      "id": "comp2",
      "name": "Database",
      "description": "Primary database",
      "status": "operational",
      "position": 2,
      "showcase": true,
      "group_id": "grp1",
      "only_show_if_degraded": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "uptime_percentage": 99.99
    },
    {
      "id": "comp3",
      "name": "Cache",
      "description": "Redis cache layer",
      "status": "operational",
      "position": 3,
      "showcase": false,
      "group_id": "grp1",
      "only_show_if_degraded": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "groups": [
    {
      "id": "grp1",
      "name": "Infrastructure",
      "description": "Core infrastructure components",
      "position": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "components": [
        {
          "id": "comp2",
          "name": "Database",
          "status": "operational",
          "uptime_percentage": 99.99
        },
        {
          "id": "comp3",
          "name": "Cache",
          "status": "operational"
        }
      ]
    }
  ]
}

// GET /api/v2/components/comp1.json
{
  "id": "comp1",
  "name": "API",
  "description": "Core API endpoints",
  "status": "operational",
  "position": 1,
  "showcase": true,
  "group_id": null,
  "only_show_if_degraded": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "uptime_percentage": 99.98,
  "group": null
}
```

### Component Status Values
```typescript
// Reference for component status values
const COMPONENT_STATUSES = {
  operational: {
    label: 'Operational',
    color: '#22c55e',
  },
  degraded_performance: {
    label: 'Degraded Performance',
    color: '#eab308',
  },
  partial_outage: {
    label: 'Partial Outage',
    color: '#f97316',
  },
  major_outage: {
    label: 'Major Outage',
    color: '#ef4444',
  },
  under_maintenance: {
    label: 'Under Maintenance',
    color: '#3b82f6',
  },
};
```

---

## Testing

- [ ] All components listed correctly
- [ ] Components sorted by position
- [ ] Groups included with nested components
- [ ] Single component retrieval works
- [ ] 404 for non-existent component
- [ ] Uptime calculated for showcase components
- [ ] Non-showcase components have no uptime
- [ ] Group info included in single response
- [ ] CORS headers present
- [ ] Cache headers present

---

## Files to Create/Modify

- `src/pages/api/v2/components.json.ts`
- `src/pages/api/v2/components/[id].json.ts`
