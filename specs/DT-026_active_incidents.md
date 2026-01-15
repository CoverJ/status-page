# DT-026: Active Incidents Display

**Epic:** Public Status Page
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-024, DT-004

---

## Description

Display active incidents prominently on the public status page, showing the incident timeline with all updates in chronological order.

---

## Acceptance Criteria

- [ ] Active incidents displayed above component list
- [ ] Each incident shows: title, impact level, current status
- [ ] Timeline of updates displayed (newest first)
- [ ] Update timestamps shown in local timezone
- [ ] Impact indicator color matches severity
- [ ] Collapsible incident cards (default expanded)
- [ ] Link to full incident history
- [ ] Empty state when no active incidents

---

## Technical Notes

### Active Incidents Component
```astro
// src/components/status/ActiveIncidents.astro
---
interface IncidentUpdate {
  id: string;
  status: string;
  body: string;
  displayAt: string;
}

interface Incident {
  id: string;
  name: string;
  status: string;
  impact: string;
  createdAt: string;
  updates: IncidentUpdate[];
}

interface Props {
  incidents: Incident[];
  pageSubdomain: string;
}

const { incidents, pageSubdomain } = Astro.props;

const IMPACT_COLORS = {
  none: 'var(--color-operational)',
  minor: 'var(--color-degraded)',
  major: 'var(--color-partial)',
  critical: 'var(--color-major)',
};

const STATUS_LABELS = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};
---

{incidents.length > 0 && (
  <section class="active-incidents">
    <h2 class="section-title">Active Incidents</h2>

    {incidents.map(incident => (
      <div class="incident-card" data-impact={incident.impact}>
        <div class="incident-header">
          <div class="incident-title-row">
            <span
              class="impact-indicator"
              style={`background-color: ${IMPACT_COLORS[incident.impact] || IMPACT_COLORS.major}`}
            />
            <h3 class="incident-title">{incident.name}</h3>
          </div>
          <span class="incident-status">{STATUS_LABELS[incident.status] || incident.status}</span>
        </div>

        <div class="incident-timeline">
          {incident.updates.map(update => (
            <div class="timeline-item">
              <div class="timeline-marker" />
              <div class="timeline-content">
                <div class="update-meta">
                  <span class="update-status">{STATUS_LABELS[update.status] || update.status}</span>
                  <time class="update-time" datetime={update.displayAt}>
                    {new Date(update.displayAt).toLocaleString()}
                  </time>
                </div>
                <p class="update-body">{update.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}

    <a href={`/${pageSubdomain}/history`} class="history-link">
      View Incident History
    </a>
  </section>
)}

<style>
  .active-incidents {
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

  .incident-card {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .incident-card[data-impact="critical"] {
    border-left: 4px solid var(--color-major);
  }

  .incident-card[data-impact="major"] {
    border-left: 4px solid var(--color-partial);
  }

  .incident-card[data-impact="minor"] {
    border-left: 4px solid var(--color-degraded);
  }

  .incident-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--color-background-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .incident-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .impact-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .incident-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .incident-status {
    font-size: 14px;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .incident-timeline {
    padding: 20px;
  }

  .timeline-item {
    display: flex;
    gap: 16px;
    position: relative;
  }

  .timeline-item:not(:last-child) {
    padding-bottom: 20px;
  }

  .timeline-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 12px;
    bottom: 0;
    width: 2px;
    background: var(--color-border);
  }

  .timeline-marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-border);
    flex-shrink: 0;
    margin-top: 4px;
  }

  .timeline-content {
    flex: 1;
  }

  .update-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .update-status {
    font-weight: 600;
    font-size: 14px;
  }

  .update-time {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .update-body {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
  }

  .history-link {
    display: block;
    text-align: center;
    font-size: 14px;
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: 12px;
  }

  .history-link:hover {
    text-decoration: underline;
  }
</style>
```

### Fetching Active Incidents with Updates
```typescript
// In status page loader
const activeIncidents = await IncidentRepository.findUnresolved(db, page.id);

// Fetch updates for each incident
const incidentsWithUpdates = await Promise.all(
  activeIncidents.map(async (incident) => {
    const updates = await IncidentUpdateRepository.findByIncidentId(db, incident.id);
    return { ...incident, updates };
  })
);
```

---

## Testing

- [ ] Active incidents displayed correctly
- [ ] Timeline shows all updates
- [ ] Impact colors render correctly
- [ ] Timestamps format in user timezone
- [ ] History link navigates correctly
- [ ] No incidents = section hidden
- [ ] Mobile responsive layout
- [ ] Accessibility for screen readers

---

## Files to Create/Modify

- `src/components/status/ActiveIncidents.astro`
- `src/pages/[subdomain]/index.astro` (integrate component)
