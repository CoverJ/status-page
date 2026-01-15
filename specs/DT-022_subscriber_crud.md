# DT-022: Manual Subscriber Management

**Epic:** Admin Dashboard - Subscriber Management
**Priority:** Medium
**Estimate:** Small
**Dependencies:** DT-021

---

## Description

Implement manual subscriber add, edit, remove operations with confirmation handling options.

---

## Acceptance Criteria

- [ ] Add subscriber form: email, component subscriptions
- [ ] Skip confirmation option for manually added subscribers
- [ ] Edit subscriber: change component subscriptions
- [ ] Remove subscriber (soft delete - set unsubscribedAt)
- [ ] Reactivate unsubscribed subscriber
- [ ] Un-quarantine subscriber
- [ ] Validation: valid email format

---

## Technical Notes

### Add Subscriber Modal
```tsx
// src/components/dashboard/AddSubscriberModal.tsx
import { useState } from 'react';

interface Component {
  id: string;
  name: string;
}

interface Props {
  pageId: string;
  components: Component[];
  onClose: () => void;
  onAdd: (subscriber: any) => void;
}

export function AddSubscriberModal({ pageId, components, onClose, onAdd }: Props) {
  const [email, setEmail] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [allComponents, setAllComponents] = useState(true);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pages/${pageId}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          componentIds: allComponents ? null : selectedComponents,
          skipConfirmation,
        }),
      });

      if (response.ok) {
        const { subscriber } = await response.json();
        onAdd(subscriber);
      } else {
        const { error } = await response.json();
        setError(error.message);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Subscriber</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <span className="icon-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="subscriber@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Component Subscriptions</label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allComponents}
                  onChange={e => setAllComponents(e.target.checked)}
                />
                Subscribe to all components
              </label>

              {!allComponents && (
                <div className="component-checkboxes">
                  {components.map(component => (
                    <label key={component.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedComponents.includes(component.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedComponents(prev => [...prev, component.id]);
                          } else {
                            setSelectedComponents(prev => prev.filter(id => id !== component.id));
                          }
                        }}
                      />
                      {component.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={skipConfirmation}
                  onChange={e => setSkipConfirmation(e.target.checked)}
                />
                Skip email confirmation (mark as confirmed immediately)
              </label>
              <p className="help-text">
                Use this when adding subscribers from a trusted source.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Subscriber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Subscriber Actions
```tsx
// src/components/dashboard/SubscriberRow.tsx
interface Props {
  subscriber: Subscriber;
  status: 'confirmed' | 'pending' | 'unsubscribed' | 'quarantined';
  componentNames: string;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  pageId: string;
}

export function SubscriberRow({ subscriber, status, componentNames, isSelected, onSelect, pageId }: Props) {
  const [isActioning, setIsActioning] = useState(false);

  async function handleAction(action: 'remove' | 'reactivate' | 'unquarantine') {
    setIsActioning(true);

    const response = await fetch(`/api/pages/${pageId}/subscribers/${subscriber.id}/${action}`, {
      method: 'POST',
    });

    if (response.ok) {
      window.location.reload(); // Simple refresh for now
    }

    setIsActioning(false);
  }

  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onSelect(e.target.checked)}
        />
      </td>
      <td className="subscriber-email">{subscriber.email}</td>
      <td>
        <StatusBadge status={status} />
      </td>
      <td className="subscriber-components">{componentNames}</td>
      <td>{formatDate(subscriber.createdAt)}</td>
      <td className="subscriber-actions">
        {status === 'confirmed' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleAction('remove')}
            disabled={isActioning}
          >
            Remove
          </button>
        )}
        {status === 'unsubscribed' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleAction('reactivate')}
            disabled={isActioning}
          >
            Reactivate
          </button>
        )}
        {status === 'quarantined' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleAction('unquarantine')}
            disabled={isActioning}
          >
            Un-quarantine
          </button>
        )}
      </td>
    </tr>
  );
}
```

### Subscriber API Endpoints
```typescript
// src/pages/api/pages/[pageId]/subscribers/index.ts
export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { email, componentIds, skipConfirmation } = await context.request.json();

  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing subscriber
  const existing = await SubscriberRepository.findByEmail(db, pageId, normalizedEmail);
  if (existing) {
    if (existing.unsubscribedAt) {
      // Reactivate
      await SubscriberRepository.update(db, existing.id, {
        unsubscribedAt: null,
        confirmedAt: skipConfirmation ? new Date().toISOString() : null,
      });
      return new Response(JSON.stringify({ subscriber: existing }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      error: { code: 'ALREADY_SUBSCRIBED', message: 'This email is already subscribed' }
    }), { status: 400 });
  }

  // Create subscriber
  const subscriber = await SubscriberRepository.create(db, {
    pageId,
    email: normalizedEmail,
    componentIds: componentIds ? JSON.stringify(componentIds) : null,
    confirmedAt: skipConfirmation ? new Date().toISOString() : null,
  });

  // Send confirmation email if not skipped
  if (!skipConfirmation) {
    const token = crypto.randomUUID();
    await SubscriberConfirmationRepository.create(db, {
      subscriberId: subscriber.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    await context.locals.runtime.env.EMAIL_QUEUE.send({
      type: 'subscriber_confirmation',
      to: normalizedEmail,
      data: { confirmUrl: `${context.locals.runtime.env.APP_URL}/confirm/${token}` },
    });
  }

  return new Response(JSON.stringify({ subscriber }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

```typescript
// src/pages/api/pages/[pageId]/subscribers/[subscriberId]/remove.ts
export const POST: APIRoute = async (context) => {
  const { pageId, subscriberId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);

  await SubscriberRepository.update(db, subscriberId, {
    unsubscribedAt: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

## Testing

- [ ] Add subscriber with valid email
- [ ] Invalid email rejected
- [ ] Duplicate email handled gracefully
- [ ] Skip confirmation marks as confirmed
- [ ] Confirmation email sent when not skipped
- [ ] Component selection saved
- [ ] Remove sets unsubscribedAt
- [ ] Reactivate clears unsubscribedAt
- [ ] Un-quarantine clears quarantinedAt

---

## Files to Create/Modify

- `src/components/dashboard/AddSubscriberModal.tsx`
- `src/components/dashboard/SubscriberRow.tsx`
- `src/pages/api/pages/[pageId]/subscribers/index.ts`
- `src/pages/api/pages/[pageId]/subscribers/[subscriberId]/remove.ts`
- `src/pages/api/pages/[pageId]/subscribers/[subscriberId]/reactivate.ts`
- `src/pages/api/pages/[pageId]/subscribers/[subscriberId]/unquarantine.ts`
