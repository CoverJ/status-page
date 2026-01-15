# DT-027: Scheduled Maintenance Display

**Epic:** Public Status Page
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-024, DT-004

---

## Description

Display scheduled maintenance events on the public status page, showing upcoming and in-progress maintenance windows with clear timing information.

---

## Acceptance Criteria

- [ ] Scheduled maintenance section displayed below status banner
- [ ] Shows maintenance title, scheduled start/end times
- [ ] Distinguishes between upcoming and in-progress maintenance
- [ ] Countdown timer for upcoming maintenance
- [ ] Progress indicator for in-progress maintenance
- [ ] Affected components listed
- [ ] Blue color theme for maintenance items
- [ ] Collapsible maintenance cards
- [ ] Empty state when no maintenance scheduled

---

## Technical Notes

### Scheduled Maintenance Component
```astro
// src/components/status/ScheduledMaintenance.astro
---
interface Maintenance {
  id: string;
  name: string;
  status: 'scheduled' | 'in_progress' | 'verifying' | 'completed';
  scheduledFor: string;
  scheduledUntil: string;
  message?: string;
  affectedComponents: { id: string; name: string }[];
}

interface Props {
  maintenances: Maintenance[];
  pageSubdomain: string;
}

const { maintenances, pageSubdomain } = Astro.props;

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function isInProgress(maintenance: Maintenance): boolean {
  return maintenance.status === 'in_progress' || maintenance.status === 'verifying';
}

function isUpcoming(maintenance: Maintenance): boolean {
  return maintenance.status === 'scheduled' && new Date(maintenance.scheduledFor) > new Date();
}
---

{maintenances.length > 0 && (
  <section class="scheduled-maintenance">
    <h2 class="section-title">Scheduled Maintenance</h2>

    {maintenances.map(maintenance => (
      <div
        class="maintenance-card"
        data-status={isInProgress(maintenance) ? 'in_progress' : 'scheduled'}
      >
        <div class="maintenance-header">
          <div class="maintenance-title-row">
            <span class="maintenance-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
            </span>
            <h3 class="maintenance-title">{maintenance.name}</h3>
          </div>
          <span class="maintenance-status">
            {isInProgress(maintenance) ? 'In Progress' : 'Scheduled'}
          </span>
        </div>

        <div class="maintenance-body">
          <div class="maintenance-schedule">
            <div class="schedule-row">
              <span class="schedule-label">Start:</span>
              <time datetime={maintenance.scheduledFor}>
                {formatDateTime(maintenance.scheduledFor)}
              </time>
            </div>
            <div class="schedule-row">
              <span class="schedule-label">End:</span>
              <time datetime={maintenance.scheduledUntil}>
                {formatDateTime(maintenance.scheduledUntil)}
              </time>
            </div>
          </div>

          {isUpcoming(maintenance) && (
            <div class="countdown" data-target={maintenance.scheduledFor}>
              <span class="countdown-label">Starts in:</span>
              <span class="countdown-value">Calculating...</span>
            </div>
          )}

          {isInProgress(maintenance) && (
            <div class="progress-bar">
              <div
                class="progress-fill"
                data-start={maintenance.scheduledFor}
                data-end={maintenance.scheduledUntil}
              />
            </div>
          )}

          {maintenance.message && (
            <p class="maintenance-message">{maintenance.message}</p>
          )}

          {maintenance.affectedComponents.length > 0 && (
            <div class="affected-components">
              <span class="components-label">Affected:</span>
              <span class="components-list">
                {maintenance.affectedComponents.map(c => c.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    ))}
  </section>
)}

<style>
  .scheduled-maintenance {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin-bottom: 16px;
  }

  .maintenance-card {
    background: var(--color-background);
    border: 1px solid var(--color-maintenance);
    border-left: 4px solid var(--color-maintenance);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .maintenance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(59, 130, 246, 0.05);
    border-bottom: 1px solid var(--color-border);
  }

  .maintenance-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .maintenance-icon {
    color: var(--color-maintenance);
    display: flex;
    align-items: center;
  }

  .maintenance-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .maintenance-status {
    font-size: 14px;
    color: var(--color-maintenance);
    font-weight: 500;
  }

  .maintenance-body {
    padding: 20px;
  }

  .maintenance-schedule {
    margin-bottom: 16px;
  }

  .schedule-row {
    display: flex;
    gap: 8px;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .schedule-label {
    font-weight: 500;
    color: var(--color-text-secondary);
    min-width: 50px;
  }

  .countdown {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .countdown-label {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .countdown-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-maintenance);
  }

  .progress-bar {
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-maintenance);
    border-radius: 4px;
    transition: width 1s ease;
  }

  .maintenance-message {
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 16px 0;
    color: var(--color-text);
  }

  .affected-components {
    display: flex;
    gap: 8px;
    font-size: 13px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }

  .components-label {
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .components-list {
    color: var(--color-text);
  }
</style>

<script>
  // Update countdown timers
  function updateCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
      const target = new Date(el.dataset.target!);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        el.querySelector('.countdown-value')!.textContent = 'Starting now...';
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        el.querySelector('.countdown-value')!.textContent = `${days} day${days > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        el.querySelector('.countdown-value')!.textContent = `${hours}h ${minutes}m`;
      } else {
        el.querySelector('.countdown-value')!.textContent = `${minutes} minutes`;
      }
    });
  }

  // Update progress bars
  function updateProgressBars() {
    document.querySelectorAll('.progress-fill').forEach(el => {
      const start = new Date(el.dataset.start!).getTime();
      const end = new Date(el.dataset.end!).getTime();
      const now = Date.now();

      const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
      (el as HTMLElement).style.width = `${progress}%`;
    });
  }

  updateCountdowns();
  updateProgressBars();
  setInterval(updateCountdowns, 60000);
  setInterval(updateProgressBars, 60000);
</script>
```

### Fetching Scheduled Maintenance
```typescript
// In status page loader
const scheduledMaintenance = await IncidentRepository.findScheduledAndInProgress(db, page.id);

// Include affected components
const maintenancesWithComponents = await Promise.all(
  scheduledMaintenance.map(async (maintenance) => {
    const affectedComponents = await IncidentComponentRepository.findByIncidentId(
      db,
      maintenance.id
    );
    return { ...maintenance, affectedComponents };
  })
);
```

---

## Testing

- [ ] Scheduled maintenance displays correctly
- [ ] In-progress maintenance shows progress bar
- [ ] Upcoming maintenance shows countdown
- [ ] Date/time formatting correct
- [ ] Affected components listed
- [ ] Blue theme applied consistently
- [ ] Countdown updates every minute
- [ ] Progress bar updates correctly
- [ ] Mobile responsive layout

---

## Files to Create/Modify

- `src/components/status/ScheduledMaintenance.astro`
- `src/pages/[subdomain]/index.astro` (integrate component)
- `src/db/repositories/incidents.ts` (add findScheduledAndInProgress)
