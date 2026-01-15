# DT-017: Create Incident Flow

**Epic:** Admin Dashboard - Incident Management
**Priority:** High
**Estimate:** Large
**Dependencies:** DT-004, DT-012, DT-016

---

## Description

Implement the incident and scheduled maintenance creation flow with component selection, status management, and notification options.

---

## Acceptance Criteria

- [ ] Incident type selection: Incident or Scheduled Maintenance
- [ ] Incident form: name, status, impact, message, affected components
- [ ] Maintenance form adds: scheduled_for and scheduled_until datetime pickers
- [ ] Component status changes: select new status for each affected component
- [ ] "Send notifications" checkbox (default checked)
- [ ] Preview of notification before sending
- [ ] Create incident and first update atomically
- [ ] Redirect to incident detail after creation

---

## Technical Notes

### Create Incident Page
```astro
// src/pages/app/[pageId]/incidents/new.astro
---
import { requirePageAccess } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import CreateIncidentForm from '@/components/dashboard/CreateIncidentForm';
import { createDb, ComponentRepository, PageRepository, IncidentTemplateRepository } from '@/db';

const { pageId } = Astro.params;
const authResponse = await requirePageAccess(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);
const page = await PageRepository.findById(db, pageId);
const components = await ComponentRepository.findByPageId(db, pageId);
const templates = await IncidentTemplateRepository.findByPageId(db, pageId);

// Check if maintenance type
const isMaintenance = Astro.url.searchParams.get('type') === 'maintenance';

const { user, membership } = Astro.locals;
---

<DashboardLayout
  pageId={pageId}
  pageName={page.name}
  user={user}
  role={membership.role}
  title={isMaintenance ? 'Schedule Maintenance' : 'Create Incident'}
>
  <CreateIncidentForm
    client:load
    pageId={pageId}
    components={components}
    templates={templates}
    isMaintenance={isMaintenance}
    timezone={page.timezone}
  />
</DashboardLayout>
```

### Create Incident Form
```tsx
// src/components/dashboard/CreateIncidentForm.tsx
import { useState } from 'react';

interface Component {
  id: string;
  name: string;
  status: string;
}

interface Template {
  id: string;
  name: string;
  incidentName: string;
  impact: string;
  message: string;
  componentIds: string[];
}

type IncidentStatus = 'investigating' | 'identified' | 'monitoring';
type MaintenanceStatus = 'scheduled' | 'in_progress';
type Impact = 'none' | 'minor' | 'major' | 'critical' | 'maintenance';
type ComponentStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';

interface Props {
  pageId: string;
  components: Component[];
  templates: Template[];
  isMaintenance: boolean;
  timezone: string;
}

export function CreateIncidentForm({ pageId, components, templates, isMaintenance, timezone }: Props) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<IncidentStatus | MaintenanceStatus>(
    isMaintenance ? 'scheduled' : 'investigating'
  );
  const [impact, setImpact] = useState<Impact>(isMaintenance ? 'maintenance' : 'major');
  const [message, setMessage] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [componentStatuses, setComponentStatuses] = useState<Record<string, ComponentStatus>>({});
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduledUntil, setScheduledUntil] = useState('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Apply template
  function applyTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setName(template.incidentName);
    setImpact(template.impact as Impact);
    setMessage(template.message);
    setSelectedComponents(template.componentIds);

    // Set default component statuses
    const statuses: Record<string, ComponentStatus> = {};
    template.componentIds.forEach(id => {
      statuses[id] = isMaintenance ? 'under_maintenance' : 'major_outage';
    });
    setComponentStatuses(statuses);
  }

  // Toggle component selection
  function toggleComponent(componentId: string) {
    setSelectedComponents(prev => {
      if (prev.includes(componentId)) {
        // Remove component and its status
        const newStatuses = { ...componentStatuses };
        delete newStatuses[componentId];
        setComponentStatuses(newStatuses);
        return prev.filter(id => id !== componentId);
      } else {
        // Add component with default status
        setComponentStatuses(prev => ({
          ...prev,
          [componentId]: isMaintenance ? 'under_maintenance' : 'major_outage',
        }));
        return [...prev, componentId];
      }
    });
  }

  // Submit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pages/${pageId}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          status,
          impact,
          message,
          componentIds: selectedComponents,
          componentStatuses,
          scheduledFor: isMaintenance ? scheduledFor : undefined,
          scheduledUntil: isMaintenance ? scheduledUntil : undefined,
          sendNotifications,
        }),
      });

      if (response.ok) {
        const { incident } = await response.json();
        window.location.href = `/app/${pageId}/incidents/${incident.id}`;
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
    <div className="create-incident-container">
      <h1>{isMaintenance ? 'Schedule Maintenance' : 'Create Incident'}</h1>

      {templates.length > 0 && (
        <div className="template-selector">
          <label>Use Template:</label>
          <select onChange={e => e.target.value && applyTemplate(e.target.value)}>
            <option value="">Select a template...</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit} className="incident-form">
        {/* Name */}
        <div className="form-group">
          <label htmlFor="name">
            {isMaintenance ? 'Maintenance Title' : 'Incident Title'} *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isMaintenance ? 'Scheduled database maintenance' : 'API service degradation'}
            required
          />
        </div>

        {/* Status */}
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          >
            {isMaintenance ? (
              <>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
              </>
            ) : (
              <>
                <option value="investigating">Investigating</option>
                <option value="identified">Identified</option>
                <option value="monitoring">Monitoring</option>
              </>
            )}
          </select>
        </div>

        {/* Impact (only for incidents) */}
        {!isMaintenance && (
          <div className="form-group">
            <label htmlFor="impact">Impact</label>
            <select
              id="impact"
              value={impact}
              onChange={e => setImpact(e.target.value as Impact)}
            >
              <option value="none">None - Informational</option>
              <option value="minor">Minor - Some users affected</option>
              <option value="major">Major - Many users affected</option>
              <option value="critical">Critical - All users affected</option>
            </select>
          </div>
        )}

        {/* Schedule (only for maintenance) */}
        {isMaintenance && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduledFor">Start Time *</label>
              <input
                type="datetime-local"
                id="scheduledFor"
                value={scheduledFor}
                onChange={e => setScheduledFor(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="scheduledUntil">End Time *</label>
              <input
                type="datetime-local"
                id="scheduledUntil"
                value={scheduledUntil}
                onChange={e => setScheduledUntil(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Message */}
        <div className="form-group">
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the issue and current status..."
            rows={4}
            required
          />
        </div>

        {/* Affected Components */}
        <div className="form-group">
          <label>Affected Components</label>
          <div className="component-selector">
            {components.map(component => (
              <div key={component.id} className="component-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedComponents.includes(component.id)}
                    onChange={() => toggleComponent(component.id)}
                  />
                  {component.name}
                </label>
                {selectedComponents.includes(component.id) && (
                  <select
                    value={componentStatuses[component.id] || 'major_outage'}
                    onChange={e => setComponentStatuses(prev => ({
                      ...prev,
                      [component.id]: e.target.value as ComponentStatus,
                    }))}
                    className="component-status-select"
                  >
                    <option value="degraded_performance">Degraded Performance</option>
                    <option value="partial_outage">Partial Outage</option>
                    <option value="major_outage">Major Outage</option>
                    <option value="under_maintenance">Under Maintenance</option>
                  </select>
                )}
              </div>
            ))}
          </div>
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

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPreview(true)}
          >
            Preview
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : isMaintenance ? 'Schedule Maintenance' : 'Create Incident'}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          incident={{ name, status, impact, message, scheduledFor, scheduledUntil }}
          components={components.filter(c => selectedComponents.includes(c.id))}
          componentStatuses={componentStatuses}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
```

### Create Incident API
```typescript
// src/pages/api/pages/[pageId]/incidents/index.ts (POST handler)
export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const {
    name,
    status,
    impact,
    message,
    componentIds,
    componentStatuses,
    scheduledFor,
    scheduledUntil,
    sendNotifications,
  } = await context.request.json();

  // Validation
  if (!name?.trim()) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
    }), { status: 400 });
  }

  if (!message?.trim()) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Message is required' }
    }), { status: 400 });
  }

  // Create incident
  const incident = await IncidentRepository.create(db, {
    pageId,
    name: name.trim(),
    status,
    impact,
    scheduledFor: scheduledFor || null,
    scheduledUntil: scheduledUntil || null,
  });

  // Create first update
  await IncidentUpdateRepository.create(db, {
    incidentId: incident.id,
    status,
    body: message.trim(),
  });

  // Update component statuses and create incident_components records
  for (const componentId of componentIds || []) {
    const component = await ComponentRepository.findById(db, componentId);
    if (component && component.pageId === pageId) {
      const oldStatus = component.status;
      const newStatus = componentStatuses?.[componentId] || 'major_outage';

      // Update component status
      await ComponentRepository.update(db, componentId, { status: newStatus });

      // Record the change
      await IncidentComponentRepository.create(db, {
        incidentId: incident.id,
        componentId,
        oldStatus,
        newStatus,
      });
    }
  }

  // Update page status indicator
  await updatePageStatus(db, pageId);

  // Queue notifications if enabled
  if (sendNotifications) {
    await context.locals.runtime.env.EMAIL_QUEUE.send({
      type: 'incident_notification',
      incidentId: incident.id,
      pageId,
      action: 'created',
    });
  }

  return new Response(JSON.stringify({ incident }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

## Testing

- [ ] Create incident with required fields
- [ ] Create maintenance with schedule times
- [ ] Template populates form fields
- [ ] Component selection works
- [ ] Component status selection works
- [ ] Incident and update created atomically
- [ ] Component statuses updated
- [ ] Page status indicator updated
- [ ] Notifications queued when enabled
- [ ] Preview shows correct content
- [ ] Redirect to detail page after creation

---

## Files to Create/Modify

- `src/pages/app/[pageId]/incidents/new.astro`
- `src/components/dashboard/CreateIncidentForm.tsx`
- `src/components/dashboard/PreviewModal.tsx`
- `src/pages/api/pages/[pageId]/incidents/index.ts`
- `src/db/repositories/incident-components.ts`
- `src/lib/utils/page-status.ts` (updatePageStatus helper)
