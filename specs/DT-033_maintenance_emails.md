# DT-033: Maintenance Notification Emails

**Epic:** Email Notifications
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-031, DT-017

---

## Description

Implement maintenance notification emails sent to subscribers for scheduled maintenance events including advance notice, start, and completion notifications.

---

## Acceptance Criteria

- [ ] Email sent when maintenance is scheduled (24h advance notice)
- [ ] Email sent when maintenance begins
- [ ] Email sent when maintenance completes
- [ ] Email includes maintenance title and description
- [ ] Email includes scheduled start/end times with timezone
- [ ] Email includes affected components
- [ ] Email includes duration estimate
- [ ] Email includes link to status page
- [ ] Preferences and unsubscribe links
- [ ] Distinct visual style (blue theme)

---

## Technical Notes

### Maintenance Email Template
```typescript
// src/lib/email/templates/maintenance.ts
import { wrapHtml } from './base';

interface Maintenance {
  id: string;
  name: string;
  status: string;
  scheduledFor: string;
  scheduledUntil: string;
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
  maintenance: Maintenance;
  page: Page;
  action: 'scheduled' | 'started' | 'completed' | 'reminder';
  subscriber: Subscriber;
  affectedComponents?: { name: string }[];
}

const MAINTENANCE_COLOR = '#3b82f6';

export function renderMaintenanceEmail(options: RenderOptions) {
  const { maintenance, page, action, subscriber, affectedComponents } = options;
  const statusPageUrl = `https://${page.subdomain}.downtime.online`;
  const preferencesUrl = `${statusPageUrl}/preferences/${subscriber.manageToken}`;
  const unsubscribeUrl = `${statusPageUrl}/unsubscribe/${subscriber.manageToken}`;

  const subject = getSubject(action, maintenance, page);
  const duration = calculateDuration(maintenance.scheduledFor, maintenance.scheduledUntil);

  const html = wrapHtml(`
    <div class="header">
      <h1 class="title">${page.name}</h1>
      <p style="margin: 0; color: #6b7280;">Scheduled Maintenance</p>
    </div>

    <div class="content">
      <div style="border-left: 4px solid ${MAINTENANCE_COLOR}; padding-left: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 18px;">${escapeHtml(maintenance.name)}</h2>
        <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; background: #dbeafe; color: #1e40af;">
          ${getStatusLabel(action)}
        </span>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 100px;">Start:</td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 500;">
              ${formatDateTime(maintenance.scheduledFor)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">End:</td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 500;">
              ${formatDateTime(maintenance.scheduledUntil)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Duration:</td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 500;">${duration}</td>
          </tr>
        </table>
      </div>

      ${affectedComponents && affectedComponents.length > 0 ? `
        <p style="font-size: 14px; margin-bottom: 16px;">
          <strong>Affected components:</strong><br>
          ${affectedComponents.map(c => escapeHtml(c.name)).join(', ')}
        </p>
      ` : ''}

      ${maintenance.updates.length > 0 ? `
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">
            ${escapeHtml(maintenance.updates[0].body)}
          </p>
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${statusPageUrl}" class="button" style="background: ${MAINTENANCE_COLOR};">
          View Status Page
        </a>
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

  const text = renderPlainText(options, duration);

  return { html, text, subject };
}

function renderPlainText(options: RenderOptions, duration: string): string {
  const { maintenance, page, action, subscriber, affectedComponents } = options;
  const statusPageUrl = `https://${page.subdomain}.downtime.online`;
  const preferencesUrl = `${statusPageUrl}/preferences/${subscriber.manageToken}`;
  const unsubscribeUrl = `${statusPageUrl}/unsubscribe/${subscriber.manageToken}`;

  let text = `${page.name} - Scheduled Maintenance\n`;
  text += `${'='.repeat(50)}\n\n`;
  text += `${maintenance.name}\n`;
  text += `Status: ${getStatusLabel(action)}\n\n`;
  text += `Start: ${formatDateTime(maintenance.scheduledFor)}\n`;
  text += `End: ${formatDateTime(maintenance.scheduledUntil)}\n`;
  text += `Duration: ${duration}\n`;

  if (affectedComponents && affectedComponents.length > 0) {
    text += `\nAffected components:\n`;
    affectedComponents.forEach(c => {
      text += `  - ${c.name}\n`;
    });
  }

  if (maintenance.updates.length > 0) {
    text += `\n${'-'.repeat(50)}\n\n`;
    text += `${maintenance.updates[0].body}\n`;
  }

  text += `\n${'-'.repeat(50)}\n\n`;
  text += `View status page: ${statusPageUrl}\n\n`;
  text += `---\n`;
  text += `Manage preferences: ${preferencesUrl}\n`;
  text += `Unsubscribe: ${unsubscribeUrl}\n`;

  return text;
}

function getSubject(action: string, maintenance: Maintenance, page: Page): string {
  const prefix = `[${page.name}]`;

  switch (action) {
    case 'scheduled':
      return `${prefix} Maintenance Scheduled: ${maintenance.name}`;
    case 'reminder':
      return `${prefix} Maintenance Reminder: ${maintenance.name} (Starting Soon)`;
    case 'started':
      return `${prefix} Maintenance Started: ${maintenance.name}`;
    case 'completed':
      return `${prefix} Maintenance Completed: ${maintenance.name}`;
    default:
      return `${prefix} Maintenance: ${maintenance.name}`;
  }
}

function getStatusLabel(action: string): string {
  switch (action) {
    case 'scheduled': return 'Scheduled';
    case 'reminder': return 'Starting Soon';
    case 'started': return 'In Progress';
    case 'completed': return 'Completed';
    default: return 'Maintenance';
  }
}

function calculateDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

### Scheduled Maintenance Reminder Job
```typescript
// src/lib/maintenance/reminders.ts
import { createDb, IncidentRepository, SubscriberRepository, PageRepository } from '@/db';

/**
 * Cron job to send maintenance reminders 24 hours before scheduled start
 * Runs every hour
 */
export async function processMaintenanceReminders(env: Env): Promise<void> {
  const db = createDb(env.DB);

  // Find maintenance events starting in the next 24-25 hours
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const upcomingMaintenance = await IncidentRepository.findScheduledInWindow(
    db,
    windowStart.toISOString(),
    windowEnd.toISOString()
  );

  for (const maintenance of upcomingMaintenance) {
    // Check if reminder already sent
    if (maintenance.reminderSentAt) continue;

    // Queue reminder notification
    await env.EMAIL_QUEUE.send({
      type: 'maintenance_notification',
      incidentId: maintenance.id,
      pageId: maintenance.pageId,
      action: 'reminder',
    });

    // Mark reminder as sent
    await IncidentRepository.update(db, maintenance.id, {
      reminderSentAt: now.toISOString(),
    });
  }
}

/**
 * Cron job to auto-start maintenance when scheduled time arrives
 * Runs every minute
 */
export async function processMaintenanceAutoStart(env: Env): Promise<void> {
  const db = createDb(env.DB);
  const now = new Date();

  // Find scheduled maintenance where start time has passed
  const startingMaintenance = await IncidentRepository.findScheduledToStart(db, now.toISOString());

  for (const maintenance of startingMaintenance) {
    // Update status to in_progress
    await IncidentRepository.update(db, maintenance.id, {
      status: 'in_progress',
    });

    // Queue start notification
    await env.EMAIL_QUEUE.send({
      type: 'maintenance_notification',
      incidentId: maintenance.id,
      pageId: maintenance.pageId,
      action: 'started',
    });
  }
}
```

### Wrangler Cron Configuration
```toml
# wrangler.toml addition
[triggers]
crons = [
  "0 * * * *",   # Maintenance reminders - every hour
  "* * * * *",   # Maintenance auto-start - every minute
]
```

### Cron Handler
```typescript
// src/workers/cron.ts
import { processMaintenanceReminders, processMaintenanceAutoStart } from '@/lib/maintenance/reminders';

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    switch (event.cron) {
      case '0 * * * *':
        ctx.waitUntil(processMaintenanceReminders(env));
        break;
      case '* * * * *':
        ctx.waitUntil(processMaintenanceAutoStart(env));
        break;
    }
  },
};
```

---

## Testing

- [ ] Email sent when maintenance scheduled
- [ ] Reminder email sent 24h before
- [ ] Email sent when maintenance starts
- [ ] Email sent when maintenance completes
- [ ] Date/time formatting correct with timezone
- [ ] Duration calculated correctly
- [ ] Affected components listed
- [ ] Blue theme applied
- [ ] Links work correctly
- [ ] Cron jobs execute on schedule
- [ ] Auto-start transitions status correctly
- [ ] Plain text version readable

---

## Files to Create/Modify

- `src/lib/email/templates/maintenance.ts`
- `src/lib/maintenance/reminders.ts`
- `src/lib/maintenance/notifications.ts`
- `src/workers/cron.ts`
- `wrangler.toml` (cron triggers)
- `src/db/schema.ts` (add reminderSentAt to incidents)
- `src/db/repositories/incidents.ts` (add findScheduledInWindow, findScheduledToStart)
