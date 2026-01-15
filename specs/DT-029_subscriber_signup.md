# DT-029: Subscriber Signup Flow

**Epic:** Public Status Page
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-024, DT-004

---

## Description

Implement the public subscriber signup flow allowing visitors to subscribe to status updates via email with double opt-in confirmation.

---

## Acceptance Criteria

- [ ] Subscribe page accessible from status page footer
- [ ] Email input with validation
- [ ] Component selection (optional - subscribe to specific components)
- [ ] Honeypot spam protection
- [ ] Rate limiting on signup submissions
- [ ] Confirmation email sent with verification link
- [ ] Verification link confirms subscription
- [ ] Success/error messaging
- [ ] GDPR-compliant with privacy notice
- [ ] Accessible form design

---

## Technical Notes

### Subscribe Page
```astro
// src/pages/[subdomain]/subscribe.astro
---
import StatusPageLayout from '@/components/status/Layout.astro';
import SubscribeForm from '@/components/status/SubscribeForm';
import { createDb, PageRepository, ComponentRepository } from '@/db';

const { subdomain } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const page = await PageRepository.findBySubdomain(db, subdomain);
if (!page) {
  return new Response('Not Found', { status: 404 });
}

const components = await ComponentRepository.findByPageId(db, page.id);

// Check if component selection is enabled
const allowComponentSelection = page.settings?.allowComponentSubscription ?? false;
---

<StatusPageLayout page={page}>
  <div class="subscribe-page">
    <header class="subscribe-header">
      <h1>Subscribe to Updates</h1>
      <p class="subscribe-description">
        Get notified about incidents and scheduled maintenance for {page.name}.
      </p>
    </header>

    <SubscribeForm
      client:load
      pageId={page.id}
      subdomain={subdomain}
      components={allowComponentSelection ? components : []}
    />

    <footer class="subscribe-footer">
      <p class="privacy-notice">
        We'll only send you notifications about service status.
        You can unsubscribe at any time.
        <a href={`/${subdomain}/privacy`}>Privacy Policy</a>
      </p>
    </footer>
  </div>
</StatusPageLayout>

<style>
  .subscribe-page {
    max-width: 480px;
    margin: 0 auto;
  }

  .subscribe-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .subscribe-header h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .subscribe-description {
    color: var(--color-text-secondary);
    font-size: 16px;
  }

  .subscribe-footer {
    margin-top: 32px;
    text-align: center;
  }

  .privacy-notice {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .privacy-notice a {
    color: inherit;
    text-decoration: underline;
  }
</style>
```

### Subscribe Form Component
```tsx
// src/components/status/SubscribeForm.tsx
import { useState } from 'react';

interface Component {
  id: string;
  name: string;
}

interface Props {
  pageId: string;
  subdomain: string;
  components: Component[];
}

export function SubscribeForm({ pageId, subdomain, components }: Props) {
  const [email, setEmail] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check
    if (honeypot) {
      setResult({ success: true, message: 'Check your email to confirm subscription.' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/pages/${pageId}/subscribers/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          componentIds: selectedComponents.length > 0 ? selectedComponents : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: 'Check your email to confirm subscription.' });
        setEmail('');
        setSelectedComponents([]);
      } else {
        setResult({ success: false, message: data.error?.message || 'Failed to subscribe' });
      }
    } catch (error) {
      setResult({ success: false, message: 'An error occurred. Please try again.' });
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
    <form onSubmit={handleSubmit} className="subscribe-form">
      {result && (
        <div className={`result-message ${result.success ? 'success' : 'error'}`}>
          {result.message}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={isSubmitting}
          aria-describedby="email-help"
        />
        <span id="email-help" className="help-text">
          We'll send a confirmation email to this address.
        </span>
      </div>

      {/* Honeypot field - hidden from real users */}
      <div className="hp-field" aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {components.length > 0 && (
        <div className="form-group">
          <fieldset>
            <legend>Notify me about (optional)</legend>
            <div className="component-options">
              {components.map(component => (
                <label key={component.id} className="component-option">
                  <input
                    type="checkbox"
                    checked={selectedComponents.includes(component.id)}
                    onChange={() => toggleComponent(component.id)}
                    disabled={isSubmitting}
                  />
                  <span>{component.name}</span>
                </label>
              ))}
            </div>
            <span className="help-text">
              Leave empty to receive all notifications.
            </span>
          </fieldset>
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
}
```

### Signup API Endpoint
```typescript
// src/pages/api/pages/[pageId]/subscribers/signup.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository, SubscriberRepository } from '@/db';
import { generateToken } from '@/lib/utils/crypto';
import { sendConfirmationEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const db = createDb(context.locals.runtime.env.DB);

  // Rate limiting: 5 requests per IP per minute
  const rateLimitResult = await rateLimit(context, 'subscriber_signup', 5, 60);
  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' }
    }), { status: 429 });
  }

  // Verify page exists
  const page = await PageRepository.findById(db, pageId);
  if (!page) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Page not found' }
    }), { status: 404 });
  }

  const { email, componentIds } = await context.request.json();

  // Validate email
  if (!email || !isValidEmail(email)) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email address' }
    }), { status: 400 });
  }

  // Check for existing subscriber
  const existing = await SubscriberRepository.findByEmail(db, pageId, email);

  if (existing) {
    if (existing.confirmedAt) {
      // Already subscribed - silently succeed (don't reveal subscription status)
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      // Resend confirmation
      const token = await regenerateConfirmationToken(db, existing.id);
      await sendConfirmationEmail(context.locals.runtime.env, {
        to: email,
        pageId,
        pageName: page.name,
        token,
        subdomain: page.subdomain,
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
  }

  // Create new subscriber
  const confirmToken = generateToken();
  const subscriber = await SubscriberRepository.create(db, {
    pageId,
    email: email.toLowerCase().trim(),
    confirmToken,
    componentIds: componentIds?.length > 0 ? componentIds : null,
  });

  // Send confirmation email
  await sendConfirmationEmail(context.locals.runtime.env, {
    to: email,
    pageId,
    pageName: page.name,
    token: confirmToken,
    subdomain: page.subdomain,
  });

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}
```

### Confirm Subscription Page
```astro
// src/pages/[subdomain]/confirm/[token].astro
---
import StatusPageLayout from '@/components/status/Layout.astro';
import { createDb, PageRepository, SubscriberRepository } from '@/db';

const { subdomain, token } = Astro.params;
const db = createDb(Astro.locals.runtime.env.DB);

const page = await PageRepository.findBySubdomain(db, subdomain);
if (!page) {
  return new Response('Not Found', { status: 404 });
}

let confirmed = false;
let error = null;

const subscriber = await SubscriberRepository.findByConfirmToken(db, token);

if (!subscriber) {
  error = 'Invalid or expired confirmation link';
} else if (subscriber.confirmedAt) {
  confirmed = true; // Already confirmed
} else {
  // Confirm the subscriber
  await SubscriberRepository.confirm(db, subscriber.id);
  confirmed = true;
}
---

<StatusPageLayout page={page}>
  <div class="confirm-page">
    {confirmed ? (
      <div class="success-message">
        <svg class="success-icon" viewBox="0 0 24 24" width="64" height="64">
          <circle cx="12" cy="12" r="10" fill="var(--color-operational)" />
          <path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" fill="none" />
        </svg>
        <h1>Subscription Confirmed!</h1>
        <p>You'll now receive notifications about {page.name} status updates.</p>
        <a href={`/${subdomain}`} class="back-link">Back to Status Page</a>
      </div>
    ) : (
      <div class="error-message">
        <h1>Confirmation Failed</h1>
        <p>{error}</p>
        <a href={`/${subdomain}/subscribe`} class="retry-link">Try subscribing again</a>
      </div>
    )}
  </div>
</StatusPageLayout>
```

---

## Testing

- [ ] Subscribe form renders correctly
- [ ] Email validation works
- [ ] Component selection works when enabled
- [ ] Honeypot blocks bots
- [ ] Rate limiting enforced
- [ ] Confirmation email sent
- [ ] Confirmation link works
- [ ] Already confirmed shows success
- [ ] Invalid token shows error
- [ ] Mobile responsive form
- [ ] Screen reader accessible

---

## Files to Create/Modify

- `src/pages/[subdomain]/subscribe.astro`
- `src/pages/[subdomain]/confirm/[token].astro`
- `src/components/status/SubscribeForm.tsx`
- `src/pages/api/pages/[pageId]/subscribers/signup.ts`
- `src/db/repositories/subscribers.ts` (add findByConfirmToken, confirm)
- `src/lib/email/templates/confirmation.ts`
