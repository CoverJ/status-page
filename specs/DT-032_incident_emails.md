# DT-032: Incident Notification Emails

**Epic:** Email Notifications
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-031, DT-017

---

## Description

Implement incident notification emails sent to subscribers when incidents are created, updated, or resolved.

---

## Acceptance Criteria

- [ ] Email sent when incident created
- [ ] Email sent when incident updated
- [ ] Email sent when incident resolved
- [ ] Email includes incident title, status, impact
- [ ] Email includes affected components
- [ ] Email includes full update message
- [ ] Email includes link to status page
- [ ] Preferences link included in footer
- [ ] One-click unsubscribe link
- [ ] Respect component-specific subscriptions
- [ ] Respect paused notifications
- [ ] Clear, professional email design

---

## Technical Notes

### Incident Email Template
```typescript
// src/lib/email/templates/incident.ts
import { wrapHtml } from './base';

interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  updates: { status: string; body: string; displayAt: string }[];
}

interface Page {
  id: string;
  name: string;
  subdomain: string;
}

interface Subscriber {
  email: string;
  manageToken: string;
}

interface RenderOptions {
  incident: Incident;
  page: Page;
  action: 'created' | 'updated' | 'resolved';
  subscriber: Subscriber;
  affectedComponents?: { name: string }[];
}

const IMPACT_COLORS = {
  none: '#22c55e',
  minor: '#eab308',
  major: '#f97316',
  critical: '#ef4444',
};

const STATUS_LABELS = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};

export function renderIncidentEmail(options: RenderOptions) {
  const { incident, page, action, subscriber, affectedComponents } = options;
  const latestUpdate = incident.updates[0];
  const statusPageUrl = `https://${page.subdomain}.downtime.online`;
  const preferencesUrl = `${statusPageUrl}/preferences/${subscriber.manageToken}`;
  const unsubscribeUrl = `${statusPageUrl}/unsubscribe/${subscriber.manageToken}`;

  const subject = getSubject(action, incident, page);
  const impactColor = IMPACT_COLORS[incident.impact] || IMPACT_COLORS.major;
  const statusLabel = STATUS_LABELS[incident.status] || incident.status;

  const html = wrapHtml(`
    <div class="header">
      <h1 class="title">${page.name}</h1>
      <p style="margin: 0; color: #6b7280;">Status Update</p>
    </div>

    <div class="content">
      <div style="border-left: 4px solid ${impactColor}; padding-left: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 18px;">${escapeHtml(incident.name)}</h2>
        <span class="status-badge status-${incident.status}">${statusLabel}</span>
      </div>

      ${affectedComponents && affectedComponents.length > 0 ? `
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">
          <strong>Affected:</strong> ${affectedComponents.map(c => escapeHtml(c.name)).join(', ')}
        </p>
      ` : ''}

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">
          ${statusLabel}
          <span style="font-weight: normal; color: #6b7280;">
            - ${formatDate(latestUpdate.displayAt)}
          </span>
        </p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6;">
          ${escapeHtml(latestUpdate.body)}
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${statusPageUrl}" class="button">View Status Page</a>
      </div>
    </div>

    <div class="footer">
      <p>
        You're receiving this because you subscribed to ${page.name} status updates.
      </p>
      <p>
        <a href="${preferencesUrl}">Manage preferences</a>
        &nbsp;|&nbsp;
        <a href="${unsubscribeUrl}">Unsubscribe</a>
      </p>
    </div>
  `, subject);

  const text = renderPlainText(options);

  return { html, text, subject };
}

function renderPlainText(options: RenderOptions): string {
  const { incident, page, action, subscriber, affectedComponents } = options;
  const latestUpdate = incident.updates[0];
  const statusPageUrl = `https://${page.subdomain}.downtime.online`;
  const preferencesUrl = `${statusPageUrl}/preferences/${subscriber.manageToken}`;
  const unsubscribeUrl = `${statusPageUrl}/unsubscribe/${subscriber.manageToken}`;

  const statusLabel = STATUS_LABELS[incident.status] || incident.status;

  let text = `${page.name} - Status Update\n`;
  text += `${'='.repeat(50)}\n\n`;
  text += `${incident.name}\n`;
  text += `Status: ${statusLabel}\n`;

  if (affectedComponents && affectedComponents.length > 0) {
    text += `Affected: ${affectedComponents.map(c => c.name).join(', ')}\n`;
  }

  text += `\n${'-'.repeat(50)}\n\n`;
  text += `${statusLabel} - ${formatDate(latestUpdate.displayAt)}\n\n`;
  text += `${latestUpdate.body}\n\n`;
  text += `${'-'.repeat(50)}\n\n`;
  text += `View status page: ${statusPageUrl}\n\n`;
  text += `---\n`;
  text += `Manage preferences: ${preferencesUrl}\n`;
  text += `Unsubscribe: ${unsubscribeUrl}\n`;

  return text;
}

function getSubject(action: string, incident: Incident, page: Page): string {
  const prefix = `[${page.name}]`;

  switch (action) {
    case 'created':
      return `${prefix} New Incident: ${incident.name}`;
    case 'updated':
      return `${prefix} Update: ${incident.name}`;
    case 'resolved':
      return `${prefix} Resolved: ${incident.name}`;
    default:
      return `${prefix} ${incident.name}`;
  }
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### Trigger Email on Incident Events
```typescript
// src/lib/incidents/notifications.ts
import type { Database } from '@/db/repositories/types';
import { SubscriberRepository, IncidentComponentRepository } from '@/db';

export async function queueIncidentNotification(
  env: Env,
  db: Database,
  incidentId: string,
  pageId: string,
  action: 'created' | 'updated' | 'resolved'
): Promise<void> {
  // Get affected component IDs
  const incidentComponents = await IncidentComponentRepository.findByIncidentId(db, incidentId);
  const componentIds = incidentComponents.map(ic => ic.componentId);

  // Get subscribers who should be notified
  const subscribers = await SubscriberRepository.findActiveForComponents(
    db,
    pageId,
    componentIds
  );

  if (subscribers.length === 0) {
    return;
  }

  // Queue the notification
  await env.EMAIL_QUEUE.send({
    type: 'incident_notification',
    incidentId,
    pageId,
    action,
    subscriberIds: subscribers.map(s => s.id),
  });
}
```

### Integration with Incident Create/Update
```typescript
// In src/pages/api/pages/[pageId]/incidents/index.ts (POST handler)
// After creating incident...
if (sendNotifications) {
  await queueIncidentNotification(
    context.locals.runtime.env,
    db,
    incident.id,
    pageId,
    'created'
  );
}

// In src/pages/api/pages/[pageId]/incidents/[incidentId]/updates.ts (POST handler)
// After adding update...
if (sendNotifications) {
  const action = update.status === 'resolved' ? 'resolved' : 'updated';
  await queueIncidentNotification(
    context.locals.runtime.env,
    db,
    incidentId,
    pageId,
    action
  );
}
```

### Filter Subscribers
```typescript
// src/db/repositories/subscribers.ts (addition)
export const SubscriberRepository = {
  // ... existing methods

  async findActiveForComponents(
    db: Database,
    pageId: string,
    componentIds: string[]
  ) {
    const now = new Date().toISOString();

    // Get all confirmed, non-paused subscribers
    const allSubscribers = await db
      .select()
      .from(subscribers)
      .where(and(
        eq(subscribers.pageId, pageId),
        isNotNull(subscribers.confirmedAt),
        isNull(subscribers.unsubscribedAt),
        or(
          isNull(subscribers.pausedUntil),
          lt(subscribers.pausedUntil, now)
        )
      ))
      .all();

    // Filter by component subscription
    return allSubscribers.filter(sub => {
      // If no component filter, include subscriber
      if (!sub.componentIds || sub.componentIds.length === 0) {
        return true;
      }
      // If component filter, check overlap
      return sub.componentIds.some(id => componentIds.includes(id));
    });
  },
};
```

---

## Testing

- [ ] Email sent on incident creation
- [ ] Email sent on incident update
- [ ] Email sent on incident resolution
- [ ] Email content renders correctly
- [ ] Subject line reflects action type
- [ ] Affected components listed
- [ ] Status page link works
- [ ] Preferences link works
- [ ] Unsubscribe link works
- [ ] Component subscriptions respected
- [ ] Paused subscribers not emailed
- [ ] Plain text version readable
- [ ] HTML renders in email clients

---

## Files to Create/Modify

- `src/lib/email/templates/incident.ts`
- `src/lib/incidents/notifications.ts`
- `src/pages/api/pages/[pageId]/incidents/index.ts` (add notification trigger)
- `src/pages/api/pages/[pageId]/incidents/[incidentId]/updates.ts` (add notification trigger)
- `src/db/repositories/subscribers.ts` (add findActiveForComponents)
