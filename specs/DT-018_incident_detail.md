# DT-018: Incident Detail & Update View

**Epic:** Admin Dashboard - Incident Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-016, DT-017

---

## Description

Build the incident detail view showing incident information, update timeline, and quick actions.

---

## Acceptance Criteria

- [ ] Incident header: name, status badge, impact badge, created date
- [ ] Timeline of all updates (newest first)
- [ ] Each update shows: status, message, timestamp, component changes
- [ ] "Add Update" button opens update form
- [ ] Quick status change buttons
- [ ] Edit incident name/impact capability
- [ ] Delete incident with confirmation (owner/admin only)
- [ ] Back to incidents list link

---

## Technical Notes

### Incident Detail Page
```astro
// src/pages/app/[pageId]/incidents/[incidentId].astro
---
import { requirePageAccess } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import IncidentDetail from '@/components/dashboard/IncidentDetail';
import { createDb, IncidentRepository, ComponentRepository, PageRepository } from '@/db';

const { pageId, incidentId } = Astro.params;
const authResponse = await requirePageAccess(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);
const page = await PageRepository.findById(db, pageId);
const incident = await IncidentRepository.findWithUpdates(db, incidentId);

if (!incident || incident.pageId !== pageId) {
  return Astro.redirect(`/app/${pageId}/incidents?error=not_found`);
}

const components = await ComponentRepository.findByPageId(db, pageId);
const { user, membership } = Astro.locals;
---

<DashboardLayout pageId={pageId} pageName={page.name} user={user} role={membership.role} title={incident.name}>
  <IncidentDetail
    client:load
    pageId={pageId}
    incident={incident}
    components={components}
    userRole={membership.role}
  />
</DashboardLayout>
```

### Incident Detail Component
```tsx
// src/components/dashboard/IncidentDetail.tsx
import { useState } from 'react';
import { UpdateTimeline } from './UpdateTimeline';
import { AddUpdateModal } from './AddUpdateModal';
import { EditIncidentModal } from './EditIncidentModal';

interface Update {
  id: string;
  status: string;
  body: string;
  displayAt: string;
  createdAt: string;
}

interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  createdAt: string;
  resolvedAt: string | null;
  scheduledFor: string | null;
  scheduledUntil: string | null;
  updates: Update[];
}

interface Component {
  id: string;
  name: string;
  status: string;
}

interface Props {
  pageId: string;
  incident: Incident;
  components: Component[];
  userRole: 'owner' | 'admin' | 'member';
}

const STATUS_CONFIG = {
  investigating: { label: 'Investigating', color: '#ef4444', next: 'identified' },
  identified: { label: 'Identified', color: '#f97316', next: 'monitoring' },
  monitoring: { label: 'Monitoring', color: '#eab308', next: 'resolved' },
  resolved: { label: 'Resolved', color: '#22c55e', next: null },
  scheduled: { label: 'Scheduled', color: '#3b82f6', next: 'in_progress' },
  in_progress: { label: 'In Progress', color: '#f97316', next: 'verifying' },
  verifying: { label: 'Verifying', color: '#eab308', next: 'completed' },
  completed: { label: 'Completed', color: '#22c55e', next: null },
};

export function IncidentDetail({ pageId, incident: initialIncident, components, userRole }: Props) {
  const [incident, setIncident] = useState(initialIncident);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const statusConfig = STATUS_CONFIG[incident.status as keyof typeof STATUS_CONFIG];
  const isResolved = ['resolved', 'completed'].includes(incident.status);
  const isMaintenance = ['scheduled', 'in_progress', 'verifying', 'completed'].includes(incident.status);

  // Quick status progression
  async function progressStatus() {
    if (!statusConfig.next) return;

    const response = await fetch(`/api/pages/${pageId}/incidents/${incident.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statusConfig.next,
        message: `Status changed to ${STATUS_CONFIG[statusConfig.next as keyof typeof STATUS_CONFIG].label}`,
      }),
    });

    if (response.ok) {
      const { incident: updated } = await response.json();
      setIncident(updated);
    }
  }

  // Delete incident
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this incident? This cannot be undone.')) {
      return;
    }

    const response = await fetch(`/api/pages/${pageId}/incidents/${incident.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      window.location.href = `/app/${pageId}/incidents`;
    }
  }

  return (
    <div className="incident-detail-container">
      {/* Header */}
      <div className="incident-header">
        <a href={`/app/${pageId}/incidents`} className="back-link">
          &larr; Back to Incidents
        </a>

        <div className="incident-title-row">
          <h1>{incident.name}</h1>
          <button className="btn btn-icon" onClick={() => setShowEdit(true)} title="Edit">
            <span className="icon-edit" />
          </button>
        </div>

        <div className="incident-meta">
          <span className="status-badge" style={{ backgroundColor: statusConfig.color }}>
            {statusConfig.label}
          </span>
          {!isMaintenance && (
            <span className="impact-badge">{incident.impact}</span>
          )}
          <span className="incident-date">
            Created {formatDateTime(incident.createdAt)}
          </span>
          {isResolved && incident.resolvedAt && (
            <span className="incident-date">
              Resolved {formatDateTime(incident.resolvedAt)}
            </span>
          )}
        </div>

        {isMaintenance && incident.scheduledFor && (
          <div className="maintenance-schedule">
            <span className="icon-calendar" />
            <span>
              {formatDateTime(incident.scheduledFor)} - {formatDateTime(incident.scheduledUntil)}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="incident-actions">
        {!isResolved && (
          <>
            <button className="btn btn-primary" onClick={() => setShowAddUpdate(true)}>
              Add Update
            </button>
            {statusConfig.next && (
              <button className="btn btn-secondary" onClick={progressStatus}>
                Mark as {STATUS_CONFIG[statusConfig.next as keyof typeof STATUS_CONFIG].label}
              </button>
            )}
          </>
        )}
        {['owner', 'admin'].includes(userRole) && (
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Incident
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="incident-timeline">
        <h2>Updates</h2>
        <UpdateTimeline updates={incident.updates} />
      </div>

      {/* Modals */}
      {showAddUpdate && (
        <AddUpdateModal
          pageId={pageId}
          incident={incident}
          components={components}
          onClose={() => setShowAddUpdate(false)}
          onUpdate={(updated) => {
            setIncident(updated);
            setShowAddUpdate(false);
          }}
        />
      )}

      {showEdit && (
        <EditIncidentModal
          pageId={pageId}
          incident={incident}
          onClose={() => setShowEdit(false)}
          onUpdate={(updated) => {
            setIncident(updated);
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

### Update Timeline Component
```tsx
// src/components/dashboard/UpdateTimeline.tsx
interface Update {
  id: string;
  status: string;
  body: string;
  displayAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  verifying: 'Verifying',
  completed: 'Completed',
};

export function UpdateTimeline({ updates }: { updates: Update[] }) {
  return (
    <div className="update-timeline">
      {updates.map((update, index) => (
        <div key={update.id} className="timeline-item">
          <div className="timeline-marker">
            <div className="marker-dot" />
            {index < updates.length - 1 && <div className="marker-line" />}
          </div>
          <div className="timeline-content">
            <div className="update-header">
              <span className="update-status">{STATUS_LABELS[update.status] || update.status}</span>
              <span className="update-time">{formatRelativeTime(update.displayAt)}</span>
            </div>
            <p className="update-body">{update.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

---

## Testing

- [ ] Incident details displayed correctly
- [ ] Status and impact badges show correctly
- [ ] Update timeline displays all updates
- [ ] Updates ordered by displayAt (newest first)
- [ ] Add Update button opens modal
- [ ] Quick status progression works
- [ ] Edit incident name/impact works
- [ ] Delete incident works (owner/admin only)
- [ ] Maintenance schedule displayed
- [ ] Resolved timestamp displayed when applicable

---

## Files to Create/Modify

- `src/pages/app/[pageId]/incidents/[incidentId].astro`
- `src/components/dashboard/IncidentDetail.tsx`
- `src/components/dashboard/UpdateTimeline.tsx`
- `src/components/dashboard/EditIncidentModal.tsx`
- `src/styles/incident-detail.css`
