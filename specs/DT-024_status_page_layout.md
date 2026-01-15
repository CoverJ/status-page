# DT-024: Status Page Layout & Styling

**Epic:** Public Status Page
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004

---

## Description

Create the public-facing status page layout with professional styling, responsive design, and fast load times.

---

## Acceptance Criteria

- [ ] Clean, minimal layout matching industry standards
- [ ] Page header with logo/name
- [ ] Overall status banner with color indicator
- [ ] Status text (e.g., "All Systems Operational")
- [ ] Footer with "Subscribe to Updates" link
- [ ] Powered by attribution
- [ ] Mobile responsive
- [ ] Fast load time (<1s TTFB from edge)
- [ ] Support for custom CSS

---

## Technical Notes

### Status Page Layout
```astro
// src/pages/[subdomain]/index.astro (or dynamic routing)
---
import StatusPageLayout from '@/components/status/Layout.astro';
import StatusBanner from '@/components/status/StatusBanner.astro';
import ComponentList from '@/components/status/ComponentList.astro';
import ActiveIncidents from '@/components/status/ActiveIncidents.astro';
import ScheduledMaintenance from '@/components/status/ScheduledMaintenance.astro';
import { createDb, PageRepository, ComponentRepository, IncidentRepository } from '@/db';

// Get page from subdomain
const subdomain = Astro.params.subdomain;
const db = createDb(Astro.locals.runtime.env.DB);

const page = await PageRepository.findBySubdomain(db, subdomain);
if (!page) {
  return new Response('Not Found', { status: 404 });
}

const components = await ComponentRepository.findByPageId(db, page.id);
const activeIncidents = await IncidentRepository.findUnresolved(db, page.id);
const scheduledMaintenance = await IncidentRepository.findScheduled(db, page.id);
---

<StatusPageLayout page={page}>
  <StatusBanner
    indicator={page.statusIndicator}
    description={page.statusDescription}
  />

  {activeIncidents.length > 0 && (
    <ActiveIncidents incidents={activeIncidents} />
  )}

  {scheduledMaintenance.length > 0 && (
    <ScheduledMaintenance maintenances={scheduledMaintenance} />
  )}

  <ComponentList components={components} />
</StatusPageLayout>
```

### Status Page Layout Component
```astro
// src/components/status/Layout.astro
---
interface Props {
  page: {
    id: string;
    name: string;
    subdomain: string;
    customCss?: string;
  };
}

const { page } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{page.name} Status</title>
    <meta name="description" content={`Current status and incidents for ${page.name}`} />

    <!-- Open Graph -->
    <meta property="og:title" content={`${page.name} Status`} />
    <meta property="og:description" content={`Check the current status of ${page.name}`} />
    <meta property="og:type" content="website" />

    <!-- Preload critical resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />

    <!-- Base styles -->
    <style>
      :root {
        --color-operational: #22c55e;
        --color-degraded: #eab308;
        --color-partial: #f97316;
        --color-major: #ef4444;
        --color-maintenance: #3b82f6;
        --color-text: #1f2937;
        --color-text-secondary: #6b7280;
        --color-border: #e5e7eb;
        --color-background: #ffffff;
        --color-background-secondary: #f9fafb;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: var(--color-text);
        background: var(--color-background-secondary);
        line-height: 1.5;
      }

      .status-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
      }

      .status-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .status-header h1 {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .status-footer {
        text-align: center;
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        font-size: 14px;
      }

      .status-footer a {
        color: inherit;
        text-decoration: none;
      }

      .status-footer a:hover {
        text-decoration: underline;
      }

      .subscribe-link {
        display: inline-block;
        margin-bottom: 16px;
        padding: 8px 16px;
        background: var(--color-text);
        color: white;
        border-radius: 4px;
        text-decoration: none;
      }

      .subscribe-link:hover {
        opacity: 0.9;
        text-decoration: none;
      }

      @media (max-width: 640px) {
        .status-page {
          padding: 16px 12px;
        }
      }
    </style>

    <!-- Custom CSS -->
    {page.customCss && <style set:html={page.customCss} />}
  </head>
  <body>
    <div class="status-page">
      <header class="status-header">
        <h1>{page.name}</h1>
      </header>

      <main>
        <slot />
      </main>

      <footer class="status-footer">
        <a href={`/${page.subdomain}/subscribe`} class="subscribe-link">
          Subscribe to Updates
        </a>
        <p>
          <a href={`/${page.subdomain}/history`}>Incident History</a>
          {' · '}
          <a href="https://downtime.online">Powered by downtime.online</a>
        </p>
      </footer>
    </div>
  </body>
</html>
```

### Status Banner Component
```astro
// src/components/status/StatusBanner.astro
---
interface Props {
  indicator: 'none' | 'minor' | 'major' | 'critical';
  description: string;
}

const { indicator, description } = Astro.props;

const colors = {
  none: 'var(--color-operational)',
  minor: 'var(--color-degraded)',
  major: 'var(--color-partial)',
  critical: 'var(--color-major)',
};

const color = colors[indicator] || colors.none;
---

<div class="status-banner" style={`background-color: ${color}`}>
  <span class="status-icon">
    {indicator === 'none' ? '✓' : '!'}
  </span>
  <span class="status-text">{description}</span>
</div>

<style>
  .status-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    border-radius: 8px;
    color: white;
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 32px;
  }

  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    font-size: 14px;
  }
</style>
```

### Edge Caching
```typescript
// src/middleware.ts (addition for status pages)
// Cache status pages at the edge
if (isStatusPage(request.url)) {
  const response = await next();

  // Cache for 1 minute at edge
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

  return response;
}
```

---

## Testing

- [ ] Status page renders correctly
- [ ] Status banner shows correct color
- [ ] Mobile responsive at 320px, 768px breakpoints
- [ ] Page loads in < 1 second
- [ ] Subscribe link works
- [ ] History link works
- [ ] Custom CSS applies correctly
- [ ] SEO meta tags present
- [ ] Open Graph tags present

---

## Files to Create/Modify

- `src/pages/[subdomain]/index.astro`
- `src/components/status/Layout.astro`
- `src/components/status/StatusBanner.astro`
- `src/styles/status-page.css`
