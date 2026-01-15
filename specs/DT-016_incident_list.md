# DT-016: Incident List View

**Epic:** Admin Dashboard - Incident Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004, DT-008

---

## Description

Build the incident list view with tabs for active, scheduled, and resolved incidents, including filtering and pagination.

---

## Acceptance Criteria

- [ ] Tabs: Active, Scheduled, Resolved
- [ ] Active tab shows investigating/identified/monitoring incidents
- [ ] Scheduled tab shows upcoming maintenance windows
- [ ] Resolved tab shows past incidents with pagination
- [ ] Each row displays: name, status badge, impact badge, affected components, date
- [ ] Click row navigates to incident detail
- [ ] "Create Incident" button
- [ ] "Schedule Maintenance" button
- [ ] Empty states for each tab

---

## Technical Notes

### Incident List Page
```astro
// src/pages/app/[pageId]/incidents/index.astro
---
import { requirePageAccess } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import IncidentList from '@/components/dashboard/IncidentList';
import { createDb, IncidentRepository, PageRepository } from '@/db';

const { pageId } = Astro.params;
const authResponse = await requirePageAccess(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);
const page = await PageRepository.findById(db, pageId);

// Fetch incidents by category
const activeIncidents = await IncidentRepository.findUnresolved(db, pageId);
const scheduledIncidents = await IncidentRepository.findScheduled(db, pageId);
const resolvedIncidents = await IncidentRepository.findResolved(db, pageId, { limit: 20 });

const { user, membership } = Astro.locals;
---

<DashboardLayout pageId={pageId} pageName={page.name} user={user} role={membership.role} title="Incidents">
  <IncidentList
    client:load
    pageId={pageId}
    initialActive={activeIncidents}
    initialScheduled={scheduledIncidents}
    initialResolved={resolvedIncidents}
  />
</DashboardLayout>
```

### Incident List Component
```tsx
// src/components/dashboard/IncidentList.tsx
import { useState } from 'react';

type TabType = 'active' | 'scheduled' | 'resolved';

interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  createdAt: string;
  scheduledFor?: string;
  resolvedAt?: string;
}

interface Props {
  pageId: string;
  initialActive: Incident[];
  initialScheduled: Incident[];
  initialResolved: Incident[];
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  investigating: { label: 'Investigating', color: '#ef4444' },
  identified: { label: 'Identified', color: '#f97316' },
  monitoring: { label: 'Monitoring', color: '#eab308' },
  resolved: { label: 'Resolved', color: '#22c55e' },
  scheduled: { label: 'Scheduled', color: '#3b82f6' },
  in_progress: { label: 'In Progress', color: '#f97316' },
  verifying: { label: 'Verifying', color: '#eab308' },
  completed: { label: 'Completed', color: '#22c55e' },
};

const IMPACT_BADGES: Record<string, { label: string; color: string }> = {
  none: { label: 'None', color: '#6b7280' },
  minor: { label: 'Minor', color: '#eab308' },
  major: { label: 'Major', color: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444' },
  maintenance: { label: 'Maintenance', color: '#3b82f6' },
};

export function IncidentList({ pageId, initialActive, initialScheduled, initialResolved }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [resolvedPage, setResolvedPage] = useState(1);
  const [resolvedIncidents, setResolvedIncidents] = useState(initialResolved);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  async function loadMoreResolved() {
    setIsLoadingMore(true);
    const response = await fetch(
      `/api/pages/${pageId}/incidents?status=resolved&page=${resolvedPage + 1}`
    );
    const data = await response.json();
    setResolvedIncidents(prev => [...prev, ...data.incidents]);
    setResolvedPage(prev => prev + 1);
    setIsLoadingMore(false);
  }

  function getIncidentsForTab(): Incident[] {
    switch (activeTab) {
      case 'active': return initialActive;
      case 'scheduled': return initialScheduled;
      case 'resolved': return resolvedIncidents;
    }
  }

  const incidents = getIncidentsForTab();

  return (
    <div className="incident-list-container">
      <div className="incident-list-header">
        <h1>Incidents</h1>
        <div className="header-actions">
          <a href={`/app/${pageId}/incidents/new?type=maintenance`} className="btn btn-secondary">
            Schedule Maintenance
          </a>
          <a href={`/app/${pageId}/incidents/new`} className="btn btn-primary">
            Create Incident
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
          {initialActive.length > 0 && (
            <span className="badge">{initialActive.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled
          {initialScheduled.length > 0 && (
            <span className="badge">{initialScheduled.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'resolved' ? 'active' : ''}`}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved
        </button>
      </div>

      {/* Incident Table */}
      {incidents.length === 0 ? (
        <EmptyState tab={activeTab} pageId={pageId} />
      ) : (
        <div className="incident-table">
          <table>
            <thead>
              <tr>
                <th>Incident</th>
                <th>Status</th>
                <th>Impact</th>
                <th>{activeTab === 'scheduled' ? 'Scheduled For' : 'Created'}</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(incident => (
                <tr
                  key={incident.id}
                  onClick={() => window.location.href = `/app/${pageId}/incidents/${incident.id}`}
                  className="clickable-row"
                >
                  <td className="incident-name">
                    <span>{incident.name}</span>
                  </td>
                  <td>
                    <StatusBadge status={incident.status} />
                  </td>
                  <td>
                    <ImpactBadge impact={incident.impact} />
                  </td>
                  <td className="incident-date">
                    {formatDate(activeTab === 'scheduled' ? incident.scheduledFor : incident.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load more for resolved */}
          {activeTab === 'resolved' && resolvedIncidents.length >= 20 * resolvedPage && (
            <div className="load-more">
              <button
                className="btn btn-secondary"
                onClick={loadMoreResolved}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGES[status] || { label: status, color: '#6b7280' };
  return (
    <span className="status-badge" style={{ backgroundColor: config.color }}>
      {config.label}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const config = IMPACT_BADGES[impact] || { label: impact, color: '#6b7280' };
  return (
    <span className="impact-badge" style={{ borderColor: config.color, color: config.color }}>
      {config.label}
    </span>
  );
}

function EmptyState({ tab, pageId }: { tab: TabType; pageId: string }) {
  const content = {
    active: {
      title: 'No active incidents',
      description: 'All systems are operational. Create an incident when issues arise.',
      action: { href: `/app/${pageId}/incidents/new`, label: 'Create Incident' },
    },
    scheduled: {
      title: 'No scheduled maintenance',
      description: 'Schedule maintenance windows to notify subscribers in advance.',
      action: { href: `/app/${pageId}/incidents/new?type=maintenance`, label: 'Schedule Maintenance' },
    },
    resolved: {
      title: 'No past incidents',
      description: 'Resolved incidents will appear here for historical reference.',
      action: null,
    },
  };

  const { title, description, action } = content[tab];

  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <a href={action.href} className="btn btn-primary">{action.label}</a>
      )}
    </div>
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## Testing

- [ ] Active tab shows unresolved incidents
- [ ] Scheduled tab shows future maintenance
- [ ] Resolved tab shows past incidents
- [ ] Tab badges show counts
- [ ] Click row navigates to detail
- [ ] Status badges display correctly
- [ ] Impact badges display correctly
- [ ] Pagination loads more resolved incidents
- [ ] Empty states shown appropriately
- [ ] Create buttons navigate correctly

---

## Files to Create/Modify

- `src/pages/app/[pageId]/incidents/index.astro`
- `src/components/dashboard/IncidentList.tsx`
- `src/styles/incidents.css`
