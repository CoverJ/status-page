# DT-030: Subscriber Preferences & Unsubscribe

**Epic:** Public Status Page
**Priority:** Medium
**Estimate:** Medium
**Dependencies:** DT-029, DT-004

---

## Description

Build subscriber preferences management pages allowing subscribers to update their notification preferences and unsubscribe from updates.

---

## Acceptance Criteria

- [ ] Preferences page accessible via link in notification emails
- [ ] Update component subscriptions
- [ ] Pause notifications temporarily
- [ ] One-click unsubscribe link
- [ ] Unsubscribe confirmation page
- [ ] Re-subscribe option after unsubscribing
- [ ] Secure token-based access (no login required)
- [ ] GDPR-compliant unsubscribe flow

---

## Technical Notes

### Preferences Page
```astro
// src/pages/[subdomain]/preferences/[token].astro
---
import StatusPageLayout from '@/components/status/Layout.astro';
import PreferencesForm from '@/components/status/PreferencesForm';
import { createDb, PageRepository, SubscriberRepository, ComponentRepository } from '@/db';

const { subdomain, token } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const page = await PageRepository.findBySubdomain(db, subdomain);
if (!page) {
  return new Response('Not Found', { status: 404 });
}

const subscriber = await SubscriberRepository.findByManageToken(db, token);
if (!subscriber || subscriber.pageId !== page.id) {
  return Astro.redirect(`/${subdomain}/subscribe`);
}

const components = await ComponentRepository.findByPageId(db, page.id);
---

<StatusPageLayout page={page}>
  <div class="preferences-page">
    <header class="preferences-header">
      <h1>Notification Preferences</h1>
      <p class="subscriber-email">{subscriber.email}</p>
    </header>

    <PreferencesForm
      client:load
      pageId={page.id}
      subdomain={subdomain}
      token={token}
      subscriber={{
        email: subscriber.email,
        componentIds: subscriber.componentIds,
        pausedUntil: subscriber.pausedUntil,
      }}
      components={components}
    />
  </div>
</StatusPageLayout>

<style>
  .preferences-page {
    max-width: 480px;
    margin: 0 auto;
  }

  .preferences-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .preferences-header h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .subscriber-email {
    color: var(--color-text-secondary);
    font-size: 14px;
  }
</style>
```

### Preferences Form Component
```tsx
// src/components/status/PreferencesForm.tsx
import { useState } from 'react';

interface Component {
  id: string;
  name: string;
}

interface Subscriber {
  email: string;
  componentIds: string[] | null;
  pausedUntil: string | null;
}

interface Props {
  pageId: string;
  subdomain: string;
  token: string;
  subscriber: Subscriber;
  components: Component[];
}

export function PreferencesForm({ pageId, subdomain, token, subscriber, components }: Props) {
  const [selectedComponents, setSelectedComponents] = useState<string[]>(
    subscriber.componentIds || []
  );
  const [pauseDuration, setPauseDuration] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isPaused = subscriber.pausedUntil && new Date(subscriber.pausedUntil) > new Date();

  async function handleSave() {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/subscribers/${token}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentIds: selectedComponents.length > 0 ? selectedComponents : null,
          pauseDuration: pauseDuration !== 'none' ? pauseDuration : null,
        }),
      });

      if (response.ok) {
        setResult({ success: true, message: 'Preferences saved successfully' });
      } else {
        const data = await response.json();
        setResult({ success: false, message: data.error?.message || 'Failed to save' });
      }
    } catch (error) {
      setResult({ success: false, message: 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleComponent(componentId: string) {
    setSelectedComponents(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  }

  return (
    <div className="preferences-form">
      {result && (
        <div className={`result-message ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}

      {isPaused && (
        <div className="pause-notice">
          Notifications paused until {new Date(subscriber.pausedUntil!).toLocaleDateString()}
        </div>
      )}

      {components.length > 0 && (
        <section className="form-section">
          <h2>Notify me about</h2>
          <div className="component-options">
            <label className="component-option">
              <input
                type="radio"
                name="notification-scope"
                checked={selectedComponents.length === 0}
                onChange={() => setSelectedComponents([])}
              />
              <span>All components</span>
            </label>
            {components.map(component => (
              <label key={component.id} className="component-option indent">
                <input
                  type="checkbox"
                  checked={selectedComponents.includes(component.id)}
                  onChange={() => toggleComponent(component.id)}
                  disabled={selectedComponents.length === 0}
                />
                <span>{component.name}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="form-section">
        <h2>Pause notifications</h2>
        <select
          value={pauseDuration}
          onChange={e => setPauseDuration(e.target.value)}
          className="pause-select"
        >
          <option value="none">Don't pause</option>
          <option value="1d">Pause for 1 day</option>
          <option value="1w">Pause for 1 week</option>
          <option value="1m">Pause for 1 month</option>
        </select>
      </section>

      <div className="form-actions">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      <hr className="divider" />

      <section className="unsubscribe-section">
        <h2>Unsubscribe</h2>
        <p>No longer want to receive notifications?</p>
        <a href={`/${subdomain}/unsubscribe/${token}`} className="unsubscribe-link">
          Unsubscribe from all notifications
        </a>
      </section>
    </div>
  );
}
```

### Unsubscribe Page
```astro
// src/pages/[subdomain]/unsubscribe/[token].astro
---
import StatusPageLayout from '@/components/status/Layout.astro';
import { createDb, PageRepository, SubscriberRepository } from '@/db';

const { subdomain, token } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const page = await PageRepository.findBySubdomain(db, subdomain);
if (!page) {
  return new Response('Not Found', { status: 404 });
}

const subscriber = await SubscriberRepository.findByManageToken(db, token);

let unsubscribed = false;
let error = null;

if (!subscriber) {
  error = 'Invalid unsubscribe link';
} else if (subscriber.unsubscribedAt) {
  unsubscribed = true; // Already unsubscribed
} else if (Astro.request.method === 'POST') {
  // Process unsubscribe
  await SubscriberRepository.unsubscribe(db, subscriber.id);
  unsubscribed = true;
}
---

<StatusPageLayout page={page}>
  <div class="unsubscribe-page">
    {error ? (
      <div class="error-state">
        <h1>Unsubscribe Failed</h1>
        <p>{error}</p>
      </div>
    ) : unsubscribed ? (
      <div class="success-state">
        <h1>Unsubscribed</h1>
        <p>You've been unsubscribed from {page.name} status notifications.</p>
        <p class="resubscribe-text">
          Changed your mind?
          <a href={`/${subdomain}/subscribe`}>Subscribe again</a>
        </p>
      </div>
    ) : (
      <div class="confirm-state">
        <h1>Confirm Unsubscribe</h1>
        <p>Are you sure you want to unsubscribe from {page.name} status notifications?</p>
        <p class="email-display">{subscriber.email}</p>
        <form method="POST" class="unsubscribe-form">
          <button type="submit" class="btn btn-danger">
            Yes, unsubscribe me
          </button>
          <a href={`/${subdomain}/preferences/${token}`} class="cancel-link">
            Cancel
          </a>
        </form>
      </div>
    )}
  </div>
</StatusPageLayout>

<style>
  .unsubscribe-page {
    max-width: 480px;
    margin: 0 auto;
    text-align: center;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: 24px;
  }

  .email-display {
    font-family: monospace;
    background: var(--color-background-secondary);
    padding: 12px 16px;
    border-radius: 4px;
    color: var(--color-text);
  }

  .unsubscribe-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    margin-top: 24px;
  }

  .btn-danger {
    background: var(--color-major);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
  }

  .btn-danger:hover {
    opacity: 0.9;
  }

  .cancel-link {
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  .resubscribe-text {
    margin-top: 32px;
  }
</style>
```

### Preferences API Endpoint
```typescript
// src/pages/api/subscribers/[token]/preferences.ts
import type { APIRoute } from 'astro';
import { createDb, SubscriberRepository } from '@/db';

export const PUT: APIRoute = async (context) => {
  const { token } = context.params;
  const db = createDb(context.locals.runtime.env.DB);

  const subscriber = await SubscriberRepository.findByManageToken(db, token);
  if (!subscriber) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Subscriber not found' }
    }), { status: 404 });
  }

  const { componentIds, pauseDuration } = await context.request.json();

  // Calculate pause until date
  let pausedUntil: string | null = null;
  if (pauseDuration) {
    const now = new Date();
    switch (pauseDuration) {
      case '1d':
        pausedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case '1w':
        pausedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '1m':
        pausedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }
  }

  await SubscriberRepository.update(db, subscriber.id, {
    componentIds,
    pausedUntil,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

---

## Testing

- [ ] Preferences page loads with valid token
- [ ] Invalid token redirects to subscribe
- [ ] Component selection updates correctly
- [ ] Pause duration calculates correctly
- [ ] Save preferences succeeds
- [ ] Unsubscribe confirmation shown
- [ ] Unsubscribe completes successfully
- [ ] Already unsubscribed shows success
- [ ] Re-subscribe link works
- [ ] Mobile responsive layout

---

## Files to Create/Modify

- `src/pages/[subdomain]/preferences/[token].astro`
- `src/pages/[subdomain]/unsubscribe/[token].astro`
- `src/components/status/PreferencesForm.tsx`
- `src/pages/api/subscribers/[token]/preferences.ts`
- `src/db/repositories/subscribers.ts` (add findByManageToken, unsubscribe)
