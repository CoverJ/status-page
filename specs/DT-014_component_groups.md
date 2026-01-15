# DT-014: Component Group Management

**Epic:** Admin Dashboard - Component Management
**Priority:** Medium
**Estimate:** Small
**Dependencies:** DT-012, DT-013

---

## Description

Implement create, edit, and delete operations for component groups including inline editing and handling component reassignment on deletion.

---

## Acceptance Criteria

- [ ] Create group modal with name field
- [ ] Edit group name inline or via modal
- [ ] Delete group moves components to ungrouped
- [ ] Validation: name required, max 50 chars
- [ ] Group position auto-assigned on create
- [ ] Expand/collapse default setting per group
- [ ] Success/error feedback

---

## Technical Notes

### Group Modal Component
```tsx
// src/components/dashboard/GroupModal.tsx
import { useState } from 'react';

interface Props {
  group?: { id: string; name: string; expanded: boolean };
  onSave: (name: string, expanded?: boolean) => Promise<void>;
  onClose: () => void;
}

export function GroupModal({ group, onSave, onClose }: Props) {
  const isEditing = !!group;
  const [name, setName] = useState(group?.name || '');
  const [expanded, setExpanded] = useState(group?.expanded ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (name.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(name.trim(), expanded);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Group' : 'Add Group'}</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <span className="icon-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="group-name">Group Name *</label>
              <input
                type="text"
                id="group-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Core Services, Infrastructure"
                maxLength={50}
                autoFocus
              />
              <span className="char-count">{name.length}/50</span>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={expanded}
                  onChange={e => setExpanded(e.target.checked)}
                />
                Expanded by default on status page
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Inline Group Editing
```tsx
// src/components/dashboard/EditableGroupHeader.tsx
import { useState, useRef, useEffect } from 'react';

interface Props {
  group: { id: string; name: string };
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => void;
  componentCount: number;
}

export function EditableGroupHeader({ group, onRename, onDelete, componentCount }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  async function handleSave() {
    if (name.trim() && name !== group.name) {
      await onRename(group.id, name.trim());
    } else {
      setName(group.name);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setName(group.name);
      setIsEditing(false);
    }
  }

  function handleDelete() {
    const message = componentCount > 0
      ? `Delete "${group.name}"? ${componentCount} component(s) will be moved to ungrouped.`
      : `Delete "${group.name}"?`;

    if (confirm(message)) {
      onDelete(group.id);
    }
  }

  return (
    <div className="group-header">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="group-name-input"
          maxLength={50}
        />
      ) : (
        <h2
          className="group-name"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to edit"
        >
          {group.name}
        </h2>
      )}

      <span className="component-count">{componentCount} component{componentCount !== 1 ? 's' : ''}</span>

      <div className="group-actions">
        <button
          className="btn btn-icon btn-sm"
          onClick={() => setIsEditing(true)}
          title="Rename"
        >
          <span className="icon-edit" />
        </button>
        <button
          className="btn btn-icon btn-sm btn-danger"
          onClick={handleDelete}
          title="Delete"
        >
          <span className="icon-trash" />
        </button>
      </div>
    </div>
  );
}
```

### Group API Endpoints
```typescript
// src/pages/api/pages/[pageId]/component-groups/index.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentGroupRepository } from '@/db';

export const GET: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const groups = await ComponentGroupRepository.findByPageId(db, pageId);

  return new Response(JSON.stringify({ groups }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { name, expanded = true } = await context.request.json();

  // Validation
  if (!name?.trim()) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
    }), { status: 400 });
  }

  if (name.length > 50) {
    return new Response(JSON.stringify({
      error: { code: 'VALIDATION_ERROR', message: 'Name must be 50 characters or less' }
    }), { status: 400 });
  }

  // Get max position
  const existingGroups = await ComponentGroupRepository.findByPageId(db, pageId);
  const maxPosition = existingGroups.reduce((max, g) => Math.max(max, g.position), -1);

  const group = await ComponentGroupRepository.create(db, {
    pageId,
    name: name.trim(),
    position: maxPosition + 1,
    expanded,
  });

  return new Response(JSON.stringify({ group }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

```typescript
// src/pages/api/pages/[pageId]/component-groups/[groupId].ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentGroupRepository, ComponentRepository } from '@/db';

export const PATCH: APIRoute = async (context) => {
  const { pageId, groupId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const updates = await context.request.json();

  // Verify group belongs to page
  const existing = await ComponentGroupRepository.findById(db, groupId);
  if (!existing || existing.pageId !== pageId) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Group not found' }
    }), { status: 404 });
  }

  // Validation
  if (updates.name !== undefined) {
    if (!updates.name?.trim()) {
      return new Response(JSON.stringify({
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
      }), { status: 400 });
    }
    if (updates.name.length > 50) {
      return new Response(JSON.stringify({
        error: { code: 'VALIDATION_ERROR', message: 'Name must be 50 characters or less' }
      }), { status: 400 });
    }
  }

  const group = await ComponentGroupRepository.update(db, groupId, {
    name: updates.name?.trim(),
    position: updates.position,
    expanded: updates.expanded,
  });

  return new Response(JSON.stringify({ group }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async (context) => {
  const { pageId, groupId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);

  // Verify group belongs to page
  const existing = await ComponentGroupRepository.findById(db, groupId);
  if (!existing || existing.pageId !== pageId) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Group not found' }
    }), { status: 404 });
  }

  // Move components to ungrouped (set groupId to null)
  await ComponentRepository.removeFromGroup(db, groupId);

  // Delete group
  await ComponentGroupRepository.delete(db, groupId);

  return new Response(null, { status: 204 });
};
```

### Repository Update
```typescript
// src/db/repositories/components.ts (addition)
async removeFromGroup(db: Database, groupId: string) {
  await db
    .update(components)
    .set({ groupId: null, updatedAt: new Date().toISOString() })
    .where(eq(components.groupId, groupId));
}
```

---

## Testing

- [ ] Create group with valid name
- [ ] Create group validation works
- [ ] Edit group name inline
- [ ] Edit group via modal
- [ ] Delete empty group
- [ ] Delete group with components moves them to ungrouped
- [ ] Expanded setting persisted
- [ ] Position auto-assigned
- [ ] Double-click triggers inline edit
- [ ] Escape cancels inline edit
- [ ] Enter saves inline edit

---

## Files to Create/Modify

- `src/components/dashboard/GroupModal.tsx`
- `src/components/dashboard/EditableGroupHeader.tsx`
- `src/pages/api/pages/[pageId]/component-groups/index.ts`
- `src/pages/api/pages/[pageId]/component-groups/[groupId].ts`
- `src/db/repositories/components.ts` (add removeFromGroup)
- `src/db/repositories/component-groups.ts`
