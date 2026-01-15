# DT-019: Add Incident Update Flow

**Epic:** Admin Dashboard - Incident Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-017, DT-018

---

## Description

Implement the flow for posting updates to existing incidents, including status changes, component status updates, and notification options.

---

## Acceptance Criteria

- [ ] Update form: new status, message, component status changes
- [ ] Status options based on incident type (incident vs maintenance states)
- [ ] Component status dropdown for each affected component
- [ ] "Send notifications" checkbox (default checked)
- [ ] Backdate option (display_at override)
- [ ] Resolving/completing updates component statuses to operational
- [ ] Update added to incident timeline
- [ ] Page status indicator recalculated

---

## Technical Notes

### Add Update Modal
```tsx
// src/components/dashboard/AddUpdateModal.tsx
import { useState } from 'react';

interface Incident {
  id: string;
  status: string;
  impact: string;
}

interface Component {
  id: string;
  name: string;
  status: string;
}

type ComponentStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';

interface Props {
  pageId: string;
  incident: Incident;
  components: Component[];
  onClose: () => void;
  onUpdate: (incident: Incident) => void;
}

const INCIDENT_STATUSES = [
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
];

const MAINTENANCE_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'verifying', label: 'Verifying' },
  { value: 'completed', label: 'Completed' },
];

export function AddUpdateModal({ pageId, incident, components, onClose, onUpdate }: Props) {
  const isMaintenance = ['scheduled', 'in_progress', 'verifying', 'completed'].includes(incident.status);
  const statuses = isMaintenance ? MAINTENANCE_STATUSES : INCIDENT_STATUSES;

  const [status, setStatus] = useState(incident.status);
  const [message, setMessage] = useState('');
  const [componentStatuses, setComponentStatuses] = useState<Record<string, ComponentStatus>>(() => {
    // Initialize with current component statuses
    const initial: Record<string, ComponentStatus> = {};
    components.forEach(c => {
      initial[c.id] = c.status as ComponentStatus;
    });
    return initial;
  });
  const [sendNotifications, setSendNotifications] = useState(true);
  const [useBackdate, setUseBackdate] = useState(false);
  const [backdateTime, setBackdateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isResolving = ['resolved', 'completed'].includes(status);

  // Auto-set components to operational when resolving
  function handleStatusChange(newStatus: string) {
    setStatus(newStatus);

    if (['resolved', 'completed'].includes(newStatus)) {
      // Set all components to operational
      const updated: Record<string, ComponentStatus> = {};
      components.forEach(c => {
        updated[c.id] = 'operational';
      });
      setComponentStatuses(updated);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim()) {
      alert('Message is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pages/${pageId}/incidents/${incident.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          message: message.trim(),
          componentStatuses,
          sendNotifications,
          displayAt: useBackdate && backdateTime ? backdateTime : undefined,
        }),
      });

      if (response.ok) {
        const { incident: updated } = await response.json();
        onUpdate(updated);
      } else {
        const { error } = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Update</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <span className="icon-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Status */}
            <div className="form-group">
              <label htmlFor="update-status">Status</label>
              <select
                id="update-status"
                value={status}
                onChange={e => handleStatusChange(e.target.value)}
              >
                {statuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="update-message">Message *</label>
              <textarea
                id="update-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={getPlaceholder(status)}
                rows={4}
                required
              />
            </div>

            {/* Component Statuses */}
            {components.length > 0 && (
              <div className="form-group">
                <label>Component Status Updates</label>
                <div className="component-status-list">
                  {components.map(component => (
                    <div key={component.id} className="component-status-row">
                      <span className="component-name">{component.name}</span>
                      <select
                        value={componentStatuses[component.id]}
                        onChange={e => setComponentStatuses(prev => ({
                          ...prev,
                          [component.id]: e.target.value as ComponentStatus,
                        }))}
                        disabled={isResolving}
                      >
                        <option value="operational">Operational</option>
                        <option value="degraded_performance">Degraded Performance</option>
                        <option value="partial_outage">Partial Outage</option>
                        <option value="major_outage">Major Outage</option>
                        <option value="under_maintenance">Under Maintenance</option>
                      </select>
                    </div>
                  ))}
                </div>
                {isResolving && (
                  <p className="help-text">
                    All components will be set to Operational when resolving.
                  </p>
                )}
              </div>
            )}

            {/* Backdate */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useBackdate}
                  onChange={e => setUseBackdate(e.target.checked)}
                />
                Backdate this update
              </label>
              {useBackdate && (
                <input
                  type="datetime-local"
                  value={backdateTime}
                  onChange={e => setBackdateTime(e.target.value)}
                  className="backdate-input"
                />
              )}
            </div>

            {/* Notifications */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendNotifications}
                  onChange={e => setSendNotifications(e.target.checked)}
                />
                Send notifications to subscribers
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getPlaceholder(status: string): string {
  switch (status) {
    case 'investigating':
      return 'We are currently investigating this issue...';
    case 'identified':
      return 'We have identified the root cause and are working on a fix...';
    case 'monitoring':
      return 'A fix has been implemented and we are monitoring the results...';
    case 'resolved':
      return 'This incident has been resolved...';
    case 'in_progress':
      return 'Maintenance is now in progress...';
    case 'verifying':
      return 'Maintenance work is complete, verifying systems...';
    case 'completed':
      return 'Maintenance has been completed successfully...';
    default:
      return 'Provide an update on the current status...';
  }
}
```

### Add Update API
```typescript
// src/pages/api/pages/[pageId]/incidents/[incidentId]/updates.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, IncidentRepository, IncidentUpdateRepository, ComponentRepository } from '@/db';
import { updatePageStatus } from '@/lib/utils/page-status';

export const POST: APIRoute = async (context) => {
  const { pageId, incidentId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { status, message, componentStatuses, sendNotifications, displayAt } = await context.request.json();

  // Verify incident belongs to page
  const incident = await IncidentRepository.findById(db, incidentId);
  if (!incident || incident.pageId !== pageId) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Incident not found' }
    }), { status: 404 });
  }

  // Create update
  const update = await IncidentUpdateRepository.create(db, {
    incidentId,
    status,
    body: message.trim(),
    displayAt: displayAt || new Date().toISOString(),
  });

  // Update incident status
  const incidentUpdates: Record<string, any> = { status };

  // Set resolved timestamp if resolving
  if (['resolved', 'completed'].includes(status)) {
    incidentUpdates.resolvedAt = new Date().toISOString();
  }

  await IncidentRepository.update(db, incidentId, incidentUpdates);

  // Update component statuses
  if (componentStatuses) {
    for (const [componentId, newStatus] of Object.entries(componentStatuses)) {
      const component = await ComponentRepository.findById(db, componentId);
      if (component && component.pageId === pageId && component.status !== newStatus) {
        await ComponentRepository.update(db, componentId, { status: newStatus as string });
      }
    }
  }

  // Recalculate page status
  await updatePageStatus(db, pageId);

  // Queue notifications
  if (sendNotifications) {
    await context.locals.runtime.env.EMAIL_QUEUE.send({
      type: 'incident_notification',
      incidentId,
      pageId,
      action: ['resolved', 'completed'].includes(status) ? 'resolved' : 'updated',
      updateId: update.id,
    });
  }

  // Return updated incident with all updates
  const updatedIncident = await IncidentRepository.findWithUpdates(db, incidentId);

  return new Response(JSON.stringify({ incident: updatedIncident }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Page Status Update Helper
```typescript
// src/lib/utils/page-status.ts
import { ComponentRepository, PageRepository } from '@/db';
import type { Database } from '@/db/repositories/types';

const STATUS_PRIORITY: Record<string, number> = {
  major_outage: 4,
  partial_outage: 3,
  degraded_performance: 2,
  under_maintenance: 1,
  operational: 0,
};

const STATUS_TO_INDICATOR: Record<string, string> = {
  major_outage: 'critical',
  partial_outage: 'major',
  degraded_performance: 'minor',
  under_maintenance: 'minor',
  operational: 'none',
};

export async function updatePageStatus(db: Database, pageId: string): Promise<void> {
  const components = await ComponentRepository.findByPageId(db, pageId);

  // Find worst status
  let worstStatus = 'operational';
  let worstPriority = 0;

  for (const component of components) {
    const priority = STATUS_PRIORITY[component.status] || 0;
    if (priority > worstPriority) {
      worstPriority = priority;
      worstStatus = component.status;
    }
  }

  const statusIndicator = STATUS_TO_INDICATOR[worstStatus] || 'none';
  const statusDescription = getStatusDescription(statusIndicator);

  await PageRepository.update(db, pageId, {
    statusIndicator,
    statusDescription,
  });
}

function getStatusDescription(indicator: string): string {
  switch (indicator) {
    case 'none': return 'All Systems Operational';
    case 'minor': return 'Minor Service Disruption';
    case 'major': return 'Partial System Outage';
    case 'critical': return 'Major System Outage';
    default: return 'All Systems Operational';
  }
}
```

---

## Testing

- [ ] Update created with correct status and message
- [ ] Incident status updated
- [ ] Component statuses updated
- [ ] Resolved timestamp set when resolving
- [ ] Components set to operational when resolving
- [ ] Page status indicator recalculated
- [ ] Notifications queued when enabled
- [ ] Backdate sets correct displayAt
- [ ] Update appears in timeline
- [ ] Status options match incident type

---

## Files to Create/Modify

- `src/components/dashboard/AddUpdateModal.tsx`
- `src/pages/api/pages/[pageId]/incidents/[incidentId]/updates.ts`
- `src/lib/utils/page-status.ts`
- `src/db/repositories/incident-updates.ts`
