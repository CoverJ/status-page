# DT-036: Public API - Status Endpoint

**Epic:** Public API (Status API)
**Priority:** High
**Estimate:** Small
**Dependencies:** DT-035

---

## Description

Implement the /api/v2/status.json endpoint providing a minimal status-only response for quick status checks and monitoring integrations.

---

## Acceptance Criteria

- [ ] GET /api/v2/status.json returns overall status
- [ ] Response includes page info
- [ ] Response includes status indicator and description
- [ ] Minimal payload for fast response
- [ ] CORS headers for public access
- [ ] Aggressive edge caching (30s TTL)
- [ ] Response matches Statuspage API format

---

## Technical Notes

### Status Endpoint
```typescript
// src/pages/api/v2/status.json.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository } from '@/db';
import { getPageFromRequest } from '@/lib/api/utils';
import { formatPage, formatStatus } from '@/lib/api/formatters';

export const GET: APIRoute = async (context) => {
  const db = createDb(context.locals.runtime.env.DB);

  const page = await getPageFromRequest(context, db);
  if (!page) {
    return new Response(JSON.stringify({
      error: 'Page not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const response = {
    page: formatPage(page),
    status: formatStatus(page),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
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
  }
}
```

### Status Indicator Values
```typescript
// Reference for status indicators
const STATUS_INDICATORS = {
  none: {
    indicator: 'none',
    description: 'All Systems Operational',
    color: '#22c55e', // green
  },
  minor: {
    indicator: 'minor',
    description: 'Minor System Outage',
    color: '#eab308', // yellow
  },
  major: {
    indicator: 'major',
    description: 'Partial System Outage',
    color: '#f97316', // orange
  },
  critical: {
    indicator: 'critical',
    description: 'Major System Outage',
    color: '#ef4444', // red
  },
  maintenance: {
    indicator: 'maintenance',
    description: 'System Under Maintenance',
    color: '#3b82f6', // blue
  },
};
```

### Integration Example
```javascript
// Example usage for monitoring tools
async function checkStatus(subdomain) {
  const response = await fetch(
    `https://${subdomain}.downtime.online/api/v2/status.json`
  );
  const data = await response.json();

  if (data.status.indicator !== 'none') {
    console.warn(`Status issue: ${data.status.description}`);
    return false;
  }

  return true;
}

// For badge/widget integration
async function getStatusBadge(subdomain) {
  const response = await fetch(
    `https://${subdomain}.downtime.online/api/v2/status.json`
  );
  const data = await response.json();

  return {
    text: data.status.description,
    color: STATUS_INDICATORS[data.status.indicator]?.color || '#22c55e',
  };
}
```

---

## Testing

- [ ] Endpoint returns valid JSON
- [ ] Page info included correctly
- [ ] Status indicator correct
- [ ] Status description correct
- [ ] Response time < 100ms
- [ ] CORS headers present
- [ ] Cache headers present
- [ ] 404 for unknown page
- [ ] OPTIONS request handled
- [ ] Different indicators based on page state

---

## Files to Create/Modify

- `src/pages/api/v2/status.json.ts`
