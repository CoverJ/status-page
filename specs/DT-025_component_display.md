# DT-025: Component Status Display

**Epic:** Public Status Page
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-024

---

## Description

Build the component status display showing all components with their current status and optional uptime metrics.

---

## Acceptance Criteria

- [ ] Components listed with name and status indicator
- [ ] Component groups collapsible (default expanded)
- [ ] Status color dot + text label
- [ ] Hover/click shows component description
- [ ] Uptime percentage display (last 90 days) for showcased components
- [ ] Empty state if no components configured
- [ ] Smooth animations for group expand/collapse

---

## Technical Notes

### Component List Component
```astro
// src/components/status/ComponentList.astro
---
interface Component {
  id: string;
  name: string;
  description: string | null;
  status: string;
  groupId: string | null;
  showcase: boolean;
}

interface Group {
  id: string;
  name: string;
  expanded: boolean;
}

interface Props {
  components: Component[];
  groups?: Group[];
  uptimeData?: Record<string, number>;
}

const { components, groups = [], uptimeData = {} } = Astro.props;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  operational: { label: 'Operational', color: 'var(--color-operational)' },
  degraded_performance: { label: 'Degraded Performance', color: 'var(--color-degraded)' },
  partial_outage: { label: 'Partial Outage', color: 'var(--color-partial)' },
  major_outage: { label: 'Major Outage', color: 'var(--color-major)' },
  under_maintenance: { label: 'Under Maintenance', color: 'var(--color-maintenance)' },
};

// Group components
const groupedComponents = groups.map(group => ({
  ...group,
  components: components.filter(c => c.groupId === group.id),
}));

const ungroupedComponents = components.filter(c => !c.groupId);
---

<section class="component-section">
  <h2 class="section-title">Components</h2>

  {components.length === 0 ? (
    <p class="empty-message">No components configured.</p>
  ) : (
    <div class="component-list">
      {/* Grouped components */}
      {groupedComponents.map(group => (
        <div class="component-group" data-expanded={group.expanded}>
          <button class="group-header" aria-expanded={group.expanded}>
            <span class="group-name">{group.name}</span>
            <span class="group-toggle">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </span>
          </button>
          <div class="group-content">
            {group.components.map(component => (
              <ComponentRow
                component={component}
                config={STATUS_CONFIG[component.status]}
                uptime={uptimeData[component.id]}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Ungrouped components */}
      {ungroupedComponents.map(component => (
        <ComponentRow
          component={component}
          config={STATUS_CONFIG[component.status]}
          uptime={uptimeData[component.id]}
        />
      ))}
    </div>
  )}
</section>

<style>
  .component-section {
    background: var(--color-background);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    margin: 0;
  }

  .component-group {
    border-bottom: 1px solid var(--color-border);
  }

  .component-group:last-child {
    border-bottom: none;
  }

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 20px;
    background: var(--color-background-secondary);
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .group-toggle {
    transition: transform 0.2s ease;
  }

  .component-group[data-expanded="false"] .group-toggle {
    transform: rotate(-90deg);
  }

  .group-content {
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .component-group[data-expanded="false"] .group-content {
    max-height: 0;
  }

  .empty-message {
    padding: 24px;
    text-align: center;
    color: var(--color-text-secondary);
  }
</style>

<script>
  // Toggle group expand/collapse
  document.querySelectorAll('.group-header').forEach(button => {
    button.addEventListener('click', () => {
      const group = button.closest('.component-group');
      const isExpanded = group?.getAttribute('data-expanded') === 'true';
      group?.setAttribute('data-expanded', String(!isExpanded));
      button.setAttribute('aria-expanded', String(!isExpanded));
    });
  });
</script>
```

### Component Row Fragment
```astro
// src/components/status/ComponentRow.astro
---
interface Props {
  component: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    showcase: boolean;
  };
  config: { label: string; color: string };
  uptime?: number;
}

const { component, config, uptime } = Astro.props;
---

<div class="component-row">
  <div class="component-info">
    <span class="component-name" title={component.description || undefined}>
      {component.name}
    </span>
    {component.showcase && uptime !== undefined && (
      <span class="component-uptime">{uptime.toFixed(2)}% uptime</span>
    )}
  </div>
  <div class="component-status">
    <span class="status-dot" style={`background-color: ${config.color}`} />
    <span class="status-label">{config.label}</span>
  </div>
</div>

<style>
  .component-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .component-row:last-child {
    border-bottom: none;
  }

  .component-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .component-name {
    font-weight: 500;
    cursor: default;
  }

  .component-name[title]:hover {
    text-decoration: underline dotted;
  }

  .component-uptime {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .component-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-label {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  @media (max-width: 480px) {
    .component-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .component-status {
      align-self: flex-end;
    }
  }
</style>
```

### Uptime Calculation
```typescript
// src/lib/utils/uptime.ts
import { IncidentRepository } from '@/db';
import type { Database } from '@/db/repositories/types';

interface UptimeData {
  [componentId: string]: number;
}

export async function calculateUptime(
  db: Database,
  pageId: string,
  componentIds: string[],
  days: number = 90
): Promise<UptimeData> {
  const result: UptimeData = {};
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const totalMinutes = days * 24 * 60;

  for (const componentId of componentIds) {
    // Get incidents affecting this component in the time range
    const incidents = await IncidentRepository.findByComponentInRange(
      db,
      componentId,
      startDate.toISOString(),
      now.toISOString()
    );

    // Calculate downtime minutes
    let downtimeMinutes = 0;
    for (const incident of incidents) {
      const start = new Date(incident.createdAt);
      const end = incident.resolvedAt ? new Date(incident.resolvedAt) : now;

      // Clamp to range
      const effectiveStart = start < startDate ? startDate : start;
      const effectiveEnd = end > now ? now : end;

      if (effectiveStart < effectiveEnd) {
        downtimeMinutes += (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000;
      }
    }

    const uptimeMinutes = totalMinutes - downtimeMinutes;
    result[componentId] = (uptimeMinutes / totalMinutes) * 100;
  }

  return result;
}
```

---

## Testing

- [ ] Components displayed correctly
- [ ] Status colors match status
- [ ] Groups expand/collapse
- [ ] Description shows on hover
- [ ] Uptime percentage calculated correctly
- [ ] Mobile responsive
- [ ] Animations smooth
- [ ] Empty state when no components

---

## Files to Create/Modify

- `src/components/status/ComponentList.astro`
- `src/components/status/ComponentRow.astro`
- `src/lib/utils/uptime.ts`
