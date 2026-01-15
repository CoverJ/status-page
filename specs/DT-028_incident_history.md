# DT-028: Incident History Page

**Epic:** Public Status Page
**Priority:** Medium
**Estimate:** Large
**Dependencies:** DT-024, DT-026

---

## Description

Create an incident history page with a calendar-based view showing past incidents, maintenance events, and historical uptime data.

---

## Acceptance Criteria

- [ ] Calendar view showing past 90 days
- [ ] Each day shows status indicator (all operational, partial issues, major issues)
- [ ] Clicking a day shows incidents for that day
- [ ] Monthly incident summary with counts
- [ ] Incident cards show full timeline when expanded
- [ ] Filter by incident type (incidents vs maintenance)
- [ ] Pagination for older incidents
- [ ] Link back to current status page
- [ ] SEO-friendly URLs (/history, /history/2024/01)

---

## Technical Notes

### History Page
```astro
// src/pages/[subdomain]/history/index.astro
---
import StatusPageLayout from '@/components/status/Layout.astro';
import HistoryCalendar from '@/components/status/HistoryCalendar.astro';
import IncidentList from '@/components/status/IncidentList.astro';
import { createDb, PageRepository, IncidentRepository } from '@/db';

const { subdomain } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const page = await PageRepository.findBySubdomain(db, subdomain);
if (!page) {
  return new Response('Not Found', { status: 404 });
}

// Get incidents for the last 90 days
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const incidents = await IncidentRepository.findInDateRange(
  db,
  page.id,
  ninetyDaysAgo.toISOString(),
  new Date().toISOString()
);

// Build calendar data
const calendarData = buildCalendarData(incidents);
---

<StatusPageLayout page={page}>
  <div class="history-page">
    <header class="history-header">
      <h1>Incident History</h1>
      <a href={`/${subdomain}`} class="back-link">Back to Status</a>
    </header>

    <HistoryCalendar data={calendarData} subdomain={subdomain} />

    <section class="recent-incidents">
      <h2>Recent Incidents</h2>
      <IncidentList incidents={incidents} />
    </section>
  </div>
</StatusPageLayout>
```

### History Calendar Component
```astro
// src/components/status/HistoryCalendar.astro
---
interface DayData {
  date: string;
  status: 'operational' | 'partial' | 'major' | 'maintenance';
  incidentCount: number;
}

interface Props {
  data: DayData[];
  subdomain: string;
}

const { data, subdomain } = Astro.props;

// Group by month
const monthGroups = groupByMonth(data);

function getStatusColor(status: string): string {
  switch (status) {
    case 'operational': return 'var(--color-operational)';
    case 'partial': return 'var(--color-partial)';
    case 'major': return 'var(--color-major)';
    case 'maintenance': return 'var(--color-maintenance)';
    default: return 'var(--color-operational)';
  }
}
---

<div class="history-calendar">
  {Object.entries(monthGroups).map(([month, days]) => (
    <div class="month-section">
      <h3 class="month-title">{month}</h3>
      <div class="calendar-grid">
        {days.map(day => (
          <a
            href={`/${subdomain}/history/${day.date}`}
            class="day-cell"
            title={`${day.date}: ${day.incidentCount} incident(s)`}
            data-status={day.status}
          >
            <span
              class="day-indicator"
              style={`background-color: ${getStatusColor(day.status)}`}
            />
            <span class="day-date">{new Date(day.date).getDate()}</span>
          </a>
        ))}
      </div>
      <div class="month-summary">
        <span class="summary-item">
          <span class="summary-dot" style="background: var(--color-operational)" />
          {days.filter(d => d.status === 'operational').length} days operational
        </span>
        <span class="summary-item">
          <span class="summary-dot" style="background: var(--color-major)" />
          {days.filter(d => d.status === 'major' || d.status === 'partial').length} days with incidents
        </span>
      </div>
    </div>
  ))}
</div>

<style>
  .history-calendar {
    margin-bottom: 48px;
  }

  .month-section {
    margin-bottom: 32px;
  }

  .month-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--color-text);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 12px;
  }

  .day-cell {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    text-decoration: none;
    font-size: 12px;
    color: var(--color-text-secondary);
    transition: transform 0.1s ease;
  }

  .day-cell:hover {
    transform: scale(1.1);
    z-index: 1;
  }

  .day-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .day-date {
    font-weight: 500;
  }

  .month-summary {
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .summary-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  @media (max-width: 640px) {
    .calendar-grid {
      gap: 2px;
    }

    .day-cell {
      font-size: 10px;
    }

    .month-summary {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>
```

### Incident List Component
```astro
// src/components/status/IncidentList.astro
---
interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  createdAt: string;
  resolvedAt: string | null;
  updates: { id: string; status: string; body: string; displayAt: string }[];
}

interface Props {
  incidents: Incident[];
  showEmpty?: boolean;
}

const { incidents, showEmpty = true } = Astro.props;
---

<div class="incident-list">
  {incidents.length === 0 && showEmpty && (
    <div class="empty-state">
      <p>No incidents to display</p>
    </div>
  )}

  {incidents.map(incident => (
    <details class="incident-item">
      <summary class="incident-summary">
        <span class="incident-date">
          {new Date(incident.createdAt).toLocaleDateString()}
        </span>
        <span class="incident-name">{incident.name}</span>
        <span class="incident-duration">
          {incident.resolvedAt
            ? `Duration: ${formatDuration(incident.createdAt, incident.resolvedAt)}`
            : 'Ongoing'
          }
        </span>
      </summary>
      <div class="incident-details">
        {incident.updates.map(update => (
          <div class="update-item">
            <span class="update-status">{update.status}</span>
            <time class="update-time">{new Date(update.displayAt).toLocaleString()}</time>
            <p class="update-body">{update.body}</p>
          </div>
        ))}
      </div>
    </details>
  ))}
</div>

<style>
  .incident-list {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .empty-state {
    padding: 48px;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .incident-item {
    border-bottom: 1px solid var(--color-border);
  }

  .incident-item:last-child {
    border-bottom: none;
  }

  .incident-summary {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    cursor: pointer;
    list-style: none;
  }

  .incident-summary::-webkit-details-marker {
    display: none;
  }

  .incident-summary::before {
    content: '+';
    font-size: 18px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .incident-item[open] .incident-summary::before {
    content: '-';
  }

  .incident-date {
    font-size: 13px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
    min-width: 100px;
  }

  .incident-name {
    font-weight: 500;
    flex: 1;
  }

  .incident-duration {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .incident-details {
    padding: 0 20px 20px 56px;
  }

  .update-item {
    padding: 12px 0;
    border-top: 1px dashed var(--color-border);
  }

  .update-status {
    font-weight: 600;
    font-size: 14px;
    text-transform: capitalize;
  }

  .update-time {
    display: block;
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 4px 0 8px;
  }

  .update-body {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }
</style>
```

### Calendar Data Builder
```typescript
// src/lib/utils/history.ts
interface Incident {
  id: string;
  status: string;
  impact: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface DayData {
  date: string;
  status: 'operational' | 'partial' | 'major' | 'maintenance';
  incidentCount: number;
}

export function buildCalendarData(incidents: Incident[]): DayData[] {
  const days: Map<string, DayData> = new Map();
  const today = new Date();

  // Initialize last 90 days
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.set(dateStr, {
      date: dateStr,
      status: 'operational',
      incidentCount: 0,
    });
  }

  // Process incidents
  for (const incident of incidents) {
    const start = new Date(incident.createdAt);
    const end = incident.resolvedAt ? new Date(incident.resolvedAt) : today;

    // Mark each day the incident was active
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const day = days.get(dateStr);

      if (day) {
        day.incidentCount++;

        // Determine worst status for the day
        if (incident.impact === 'critical' || incident.impact === 'major') {
          day.status = 'major';
        } else if (incident.impact === 'maintenance' && day.status === 'operational') {
          day.status = 'maintenance';
        } else if (day.status === 'operational') {
          day.status = 'partial';
        }
      }

      current.setDate(current.getDate() + 1);
    }
  }

  return Array.from(days.values()).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function groupByMonth(days: DayData[]): Record<string, DayData[]> {
  const groups: Record<string, DayData[]> = {};

  for (const day of days) {
    const date = new Date(day.date);
    const month = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(day);
  }

  return groups;
}
```

---

## Testing

- [ ] Calendar displays last 90 days
- [ ] Day status colors correct
- [ ] Clicking day navigates to detail
- [ ] Monthly summaries accurate
- [ ] Incident list expandable
- [ ] Incident timelines complete
- [ ] Back to status link works
- [ ] Mobile responsive calendar
- [ ] SEO meta tags present

---

## Files to Create/Modify

- `src/pages/[subdomain]/history/index.astro`
- `src/pages/[subdomain]/history/[date].astro`
- `src/components/status/HistoryCalendar.astro`
- `src/components/status/IncidentList.astro`
- `src/lib/utils/history.ts`
- `src/db/repositories/incidents.ts` (add findInDateRange)
