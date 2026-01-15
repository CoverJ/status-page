# DT-015: Component Drag-and-Drop Reordering

**Epic:** Admin Dashboard - Component Management
**Priority:** Low
**Estimate:** Medium
**Dependencies:** DT-012, DT-013, DT-014

---

## Description

Implement drag-and-drop functionality to reorder components within groups, between groups, and to reorder groups themselves.

---

## Acceptance Criteria

- [ ] Drag components to reorder within a group
- [ ] Drag components between groups (changes group assignment)
- [ ] Drag groups to reorder
- [ ] Order persisted to database on drop
- [ ] Visual feedback during drag (placeholder, drag handle)
- [ ] Keyboard accessibility for reordering
- [ ] Optimistic UI updates
- [ ] Handle failed reorder gracefully

---

## Technical Notes

### Using @dnd-kit Library
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Sortable Component List
```tsx
// src/components/dashboard/SortableComponentList.tsx
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { SortableGroup } from './SortableGroup';
import { SortableComponent } from './SortableComponent';

interface Component {
  id: string;
  name: string;
  status: string;
  groupId: string | null;
  position: number;
}

interface Group {
  id: string;
  name: string;
  position: number;
}

interface Props {
  pageId: string;
  components: Component[];
  groups: Group[];
  onReorderComponents: (updates: { id: string; position: number; groupId: string | null }[]) => Promise<void>;
  onReorderGroups: (updates: { id: string; position: number }[]) => Promise<void>;
}

export function SortableComponentList({
  pageId,
  components,
  groups,
  onReorderComponents,
  onReorderGroups,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState(components);
  const [groupItems, setGroupItems] = useState(groups);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeComponent = items.find(c => c.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find(c => c.id === active.id);
    if (!activeItem) return;

    // Check if dragging over a group
    const overGroup = groupItems.find(g => g.id === over.id);
    if (overGroup && activeItem.groupId !== overGroup.id) {
      // Move to new group
      setItems(prev =>
        prev.map(c =>
          c.id === active.id ? { ...c, groupId: overGroup.id } : c
        )
      );
    }

    // Check if dragging over ungrouped area
    if (over.id === 'ungrouped' && activeItem.groupId !== null) {
      setItems(prev =>
        prev.map(c =>
          c.id === active.id ? { ...c, groupId: null } : c
        )
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Check if reordering groups
    const activeGroup = groupItems.find(g => g.id === active.id);
    const overGroup = groupItems.find(g => g.id === over.id);

    if (activeGroup && overGroup) {
      const oldIndex = groupItems.findIndex(g => g.id === active.id);
      const newIndex = groupItems.findIndex(g => g.id === over.id);

      const newGroups = arrayMove(groupItems, oldIndex, newIndex);
      setGroupItems(newGroups);

      // Persist group order
      const updates = newGroups.map((g, i) => ({ id: g.id, position: i }));
      await onReorderGroups(updates);
      return;
    }

    // Reordering components
    const activeComponent = items.find(c => c.id === active.id);
    const overComponent = items.find(c => c.id === over.id);

    if (activeComponent && overComponent) {
      // Get components in the same group
      const groupId = activeComponent.groupId;
      const groupComponents = items.filter(c => c.groupId === groupId);

      const oldIndex = groupComponents.findIndex(c => c.id === active.id);
      const newIndex = groupComponents.findIndex(c => c.id === over.id);

      const reordered = arrayMove(groupComponents, oldIndex, newIndex);

      // Update positions
      const updatedItems = items.map(c => {
        if (c.groupId !== groupId) return c;
        const newPosition = reordered.findIndex(r => r.id === c.id);
        return { ...c, position: newPosition };
      });

      setItems(updatedItems);

      // Persist component order
      const updates = reordered.map((c, i) => ({
        id: c.id,
        position: i,
        groupId: c.groupId,
      }));
      await onReorderComponents(updates);
    }
  }

  // Group components by group
  const groupedComponents = groupItems.map(group => ({
    ...group,
    components: items
      .filter(c => c.groupId === group.id)
      .sort((a, b) => a.position - b.position),
  }));

  const ungroupedComponents = items
    .filter(c => c.groupId === null)
    .sort((a, b) => a.position - b.position);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={groupItems.map(g => g.id)}
        strategy={verticalListSortingStrategy}
      >
        {groupedComponents.map(group => (
          <SortableGroup key={group.id} group={group}>
            <SortableContext
              items={group.components.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.components.map(component => (
                <SortableComponent key={component.id} component={component} />
              ))}
            </SortableContext>
          </SortableGroup>
        ))}
      </SortableContext>

      {/* Ungrouped components */}
      <div id="ungrouped" className="component-group ungrouped">
        <h2>Ungrouped</h2>
        <SortableContext
          items={ungroupedComponents.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {ungroupedComponents.map(component => (
            <SortableComponent key={component.id} component={component} />
          ))}
        </SortableContext>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeComponent ? (
          <div className="component-card dragging">
            {activeComponent.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Sortable Component Item
```tsx
// src/components/dashboard/SortableComponent.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  component: { id: string; name: string; status: string };
}

export function SortableComponent({ component }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`component-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
    >
      <button className="drag-handle" {...listeners} aria-label="Drag to reorder">
        <span className="icon-grip-vertical" />
      </button>
      <span className="component-name">{component.name}</span>
      {/* ... rest of component card */}
    </div>
  );
}
```

### Batch Reorder API
```typescript
// src/pages/api/pages/[pageId]/components/reorder.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentRepository } from '@/db';

export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { updates } = await context.request.json();

  // updates: [{ id, position, groupId }, ...]

  // Verify all components belong to this page
  for (const update of updates) {
    const component = await ComponentRepository.findById(db, update.id);
    if (!component || component.pageId !== pageId) {
      return new Response(JSON.stringify({
        error: { code: 'INVALID_COMPONENT', message: 'Invalid component ID' }
      }), { status: 400 });
    }
  }

  // Batch update
  await ComponentRepository.batchUpdatePositions(db, updates);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

```typescript
// src/pages/api/pages/[pageId]/component-groups/reorder.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, ComponentGroupRepository } from '@/db';

export const POST: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { updates } = await context.request.json();

  // Verify all groups belong to this page
  for (const update of updates) {
    const group = await ComponentGroupRepository.findById(db, update.id);
    if (!group || group.pageId !== pageId) {
      return new Response(JSON.stringify({
        error: { code: 'INVALID_GROUP', message: 'Invalid group ID' }
      }), { status: 400 });
    }
  }

  // Batch update
  await ComponentGroupRepository.batchUpdatePositions(db, updates);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Repository Updates
```typescript
// src/db/repositories/components.ts (addition)
async batchUpdatePositions(
  db: Database,
  updates: { id: string; position: number; groupId: string | null }[]
) {
  // SQLite doesn't support batch updates easily, so we do individual updates
  // Could optimize with a transaction
  for (const update of updates) {
    await db
      .update(components)
      .set({
        position: update.position,
        groupId: update.groupId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(components.id, update.id));
  }
}
```

---

## Testing

- [ ] Drag component within same group reorders
- [ ] Drag component to different group changes groupId
- [ ] Drag component to ungrouped section removes from group
- [ ] Drag group reorders groups
- [ ] Visual feedback shown during drag
- [ ] Drop target highlighted
- [ ] Order persisted to database
- [ ] Failed reorder reverts UI
- [ ] Keyboard navigation works (Tab, Space, Arrow keys)
- [ ] Screen reader announces reorder

---

## Files to Create/Modify

- `src/components/dashboard/SortableComponentList.tsx`
- `src/components/dashboard/SortableComponent.tsx`
- `src/components/dashboard/SortableGroup.tsx`
- `src/pages/api/pages/[pageId]/components/reorder.ts`
- `src/pages/api/pages/[pageId]/component-groups/reorder.ts`
- `src/db/repositories/components.ts` (add batchUpdatePositions)
- `src/db/repositories/component-groups.ts` (add batchUpdatePositions)
- `src/styles/drag-drop.css`
