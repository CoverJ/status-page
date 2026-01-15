# DT-013: Component CRUD Operations

**Epic:** Admin Dashboard - Component Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004, DT-012

---

## Description

Implement create, edit, and delete operations for components including the modal forms and API endpoints.

---

## Acceptance Criteria

- [ ] Create component modal with name, description, group, status fields
- [ ] Edit component modal (same fields as create)
- [ ] Delete component with confirmation dialog
- [ ] Validation: name required, max 100 chars
- [ ] Description optional, max 500 chars
- [ ] Component position auto-assigned on create
- [ ] Success/error toast notifications
- [ ] Optimistic UI updates

---

## Technical Notes

### Component Modal
```tsx
// src/components/dashboard/ComponentModal.tsx
import { useState } from 'react';

interface Component {
  id: string;
  name: string;
  description: string | null;
  status: ComponentStatus;
  groupId: string | null;
}

interface Group {
  id: string;
  name: string;
}

type ComponentStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';

interface Props {
  component?: Component;
  groups: Group[];
  onSave: (data: Partial<Component>) => Promise<void>;
  onClose: () => void;
}

export function ComponentModal({ component, groups, onSave, onClose }: Props) {
  const isEditing = !!component;
  const [name, setName] = useState(component?.name || '');
  const [description, setDescription] = useState(component?.description || '');
  const [groupId, setGroupId] = useState(component?.groupId || '');
  const [status, setStatus] = useState<ComponentStatus>(component?.status || 'operational');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        groupId: groupId || null,
        status,
      });
    } catch (error) {
      setErrors({ form: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Component' : 'Add Component'}</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <span className="icon-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.form && <div className="error-banner">{errors.form}</div>}

            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., API, Dashboard, Database"
                maxLength={100}
                autoFocus
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief description of this component..."
                rows={3}
                maxLength={500}
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
              <span className="char-count">{description.length}/500</span>
            </div>

            <div className="form-group">
              <label htmlFor="group">Group</label>
              <select
                id="group"
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
              >
                <option value="">No group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Initial Status</label>
              <select
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value as ComponentStatus)}
              >
                <option value="operational">Operational</option>
                <option value="degraded_performance">Degraded Performance</option>
                <option value="partial_outage">Partial Outage</option>
                <option value="major_outage">Major Outage</option>
                <option value="under_maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Component API Endpoints
```typescript
// src/pages/api/pages/[pageId]/components/index.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentRepository } from '@/db';

export const GET: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const components = await ComponentRepository.findByPageId(db, pageId);

  return new Response(JSON.stringify({ components }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { name, description, groupId, status } = await context.request.json();

  // Validation
  if (!name?.trim()) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
    }), { status: 400 });
  }

  if (name.length > 100) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Name must be 100 characters or less' }
    }), { status: 400 });
  }

  // Get max position for auto-assignment
  const existingComponents = await ComponentRepository.findByPageId(db, pageId);
  const maxPosition = existingComponents.reduce(
    (max, c) => Math.max(max, c.position),
    -1
  );

  const component = await ComponentRepository.create(db, {
    pageId,
    name: name.trim(),
    description: description?.trim() || null,
    groupId: groupId || null,
    status: status || 'operational',
    position: maxPosition + 1,
  });

  return new Response(JSON.stringify({ component }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

```typescript
// src/pages/api/pages/[pageId]/components/[componentId].ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentRepository } from '@/db';

export const GET: APIRoute = async (context) => {
  const { pageId, componentId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const component = await ComponentRepository.findById(db, componentId);

  if (!component || component.pageId !== pageId) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Component not found' }
    }), { status: 404 });
  }

  return new Response(JSON.stringify({ component }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async (context) => {
  const { pageId, componentId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const updates = await context.request.json();

  // Verify component belongs to page
  const existing = await ComponentRepository.findById(db, componentId);
  if (!existing || existing.pageId !== pageId) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Component not found' }
    }), { status: 404 });
  }

  // Validation
  if (updates.name !== undefined) {
    if (!updates.name?.trim()) {
      return new Response(JSON.stringify({
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
      }), { status: 400 });
    }
    if (updates.name.length > 100) {
      return new Response(JSON.stringify({
        error: { code: 'VALIDATION_ERROR', message: 'Name must be 100 characters or less' }
      }), { status: 400 });
    }
  }

  const component = await ComponentRepository.update(db, componentId, {
    name: updates.name?.trim(),
    description: updates.description?.trim() || null,
    groupId: updates.groupId ?? existing.groupId,
    status: updates.status,
    position: updates.position,
  });

  return new Response(JSON.stringify({ component }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async (context) => {
  const { pageId, componentId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);

  // Verify component belongs to page
  const existing = await ComponentRepository.findById(db, componentId);
  if (!existing || existing.pageId !== pageId) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Component not found' }
    }), { status: 404 });
  }

  await ComponentRepository.delete(db, componentId);

  return new Response(null, { status: 204 });
};
```

### Toast Notifications
```tsx
// src/components/ui/Toast.tsx
import { useState, useEffect, createContext, useContext } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast(message: string, type: Toast['type']) {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              <span className="icon-x" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

---

## Testing

- [ ] Create component with all fields works
- [ ] Create component with only required fields works
- [ ] Name validation enforced (required, max length)
- [ ] Description max length enforced
- [ ] Edit component updates all fields
- [ ] Status change updates component
- [ ] Delete component with confirmation
- [ ] Error displayed on validation failure
- [ ] Success toast on save
- [ ] Modal closes after successful save
- [ ] Position auto-assigned on create

---

## Files to Create/Modify

- `src/components/dashboard/ComponentModal.tsx`
- `src/pages/api/pages/[pageId]/components/index.ts`
- `src/pages/api/pages/[pageId]/components/[componentId].ts`
- `src/components/ui/Toast.tsx`
- `src/styles/modal.css`
