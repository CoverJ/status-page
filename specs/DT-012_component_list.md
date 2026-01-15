# DT-012: Component List View

**Epic:** Admin Dashboard - Component Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004, DT-008

---

## Description

Build the component list view displaying all components grouped by component group with status indicators and quick status change functionality.

---

## Acceptance Criteria

- [ ] List all components organized by component group
- [ ] Ungrouped components shown in separate section
- [ ] Display component name, description, and current status
- [ ] Status indicator color matches component status
- [ ] Quick status change dropdown on each component
- [ ] "Add Component" button
- [ ] "Add Group" button
- [ ] Empty state for pages with no components
- [ ] Component count displayed in header

---

## Technical Notes

### Component List Page
```astro
// src/pages/app/[pageId]/components/index.astro
---
import { requirePageAccess } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import { createDb, ComponentRepository, ComponentGroupRepository, PageRepository } from '@/db';
import ComponentList from '@/components/dashboard/ComponentList';

const { pageId } = Astro.params;
const authResponse = await requirePageAccess(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);
const page = await PageRepository.findById(db, pageId);
const components = await ComponentRepository.findByPageId(db, pageId);
const groups = await ComponentGroupRepository.findByPageId(db, pageId);

const { user, membership } = Astro.locals;
---

<DashboardLayout pageId={pageId} pageName={page.name} user={user} role={membership.role} title="Components">
  <ComponentList
    client:load
    pageId={pageId}
    initialComponents={components}
    initialGroups={groups}
  />
</DashboardLayout>
```

### Component List React Component
```tsx
// src/components/dashboard/ComponentList.tsx
import { useState } from 'react';
import { ComponentCard } from './ComponentCard';
import { ComponentModal } from './ComponentModal';
import { GroupModal } from './GroupModal';

interface Component {
  id: string;
  name: string;
  description: string | null;
  status: ComponentStatus;
  groupId: string | null;
  position: number;
}

interface Group {
  id: string;
  name: string;
  position: number;
  expanded: boolean;
}

type ComponentStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';

interface Props {
  pageId: string;
  initialComponents: Component[];
  initialGroups: Group[];
}

const STATUS_CONFIG: Record<ComponentStatus, { label: string; color: string }> = {
  operational: { label: 'Operational', color: '#22c55e' },
  degraded_performance: { label: 'Degraded Performance', color: '#eab308' },
  partial_outage: { label: 'Partial Outage', color: '#f97316' },
  major_outage: { label: 'Major Outage', color: '#ef4444' },
  under_maintenance: { label: 'Under Maintenance', color: '#3b82f6' },
};

export function ComponentList({ pageId, initialComponents, initialGroups }: Props) {
  const [components, setComponents] = useState(initialComponents);
  const [groups, setGroups] = useState(initialGroups);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);

  // Group components
  const groupedComponents = groups.map(group => ({
    ...group,
    components: components
      .filter(c => c.groupId === group.id)
      .sort((a, b) => a.position - b.position),
  }));

  const ungroupedComponents = components
    .filter(c => !c.groupId)
    .sort((a, b) => a.position - b.position);

  // Quick status change
  async function handleStatusChange(componentId: string, newStatus: ComponentStatus) {
    const response = await fetch(`/api/pages/${pageId}/components/${componentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (response.ok) {
      setComponents(prev =>
        prev.map(c => c.id === componentId ? { ...c, status: newStatus } : c)
      );
    }
  }

  // Add component
  async function handleAddComponent(data: Partial<Component>) {
    const response = await fetch(`/api/pages/${pageId}/components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const { component } = await response.json();
      setComponents(prev => [...prev, component]);
      setShowComponentModal(false);
    }
  }

  // Edit component
  async function handleEditComponent(data: Partial<Component>) {
    if (!editingComponent) return;

    const response = await fetch(`/api/pages/${pageId}/components/${editingComponent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const { component } = await response.json();
      setComponents(prev =>
        prev.map(c => c.id === component.id ? component : c)
      );
      setEditingComponent(null);
    }
  }

  // Delete component
  async function handleDeleteComponent(componentId: string) {
    if (!confirm('Are you sure you want to delete this component?')) return;

    const response = await fetch(`/api/pages/${pageId}/components/${componentId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setComponents(prev => prev.filter(c => c.id !== componentId));
    }
  }

  // Add group
  async function handleAddGroup(name: string) {
    const response = await fetch(`/api/pages/${pageId}/component-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const { group } = await response.json();
      setGroups(prev => [...prev, group]);
      setShowGroupModal(false);
    }
  }

  return (
    <div className="component-list-container">
      <div className="component-list-header">
        <h1>Components ({components.length})</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowGroupModal(true)}>
            Add Group
          </button>
          <button className="btn btn-primary" onClick={() => setShowComponentModal(true)}>
            Add Component
          </button>
        </div>
      </div>

      {components.length === 0 ? (
        <div className="empty-state">
          <h2>No components yet</h2>
          <p>Components represent the different parts of your service that you want to track.</p>
          <button className="btn btn-primary" onClick={() => setShowComponentModal(true)}>
            Add Your First Component
          </button>
        </div>
      ) : (
        <>
          {/* Grouped components */}
          {groupedComponents.map(group => (
            <div key={group.id} className="component-group">
              <div className="group-header">
                <h2>{group.name}</h2>
                <span className="component-count">{group.components.length} components</span>
              </div>
              <div className="component-cards">
                {group.components.map(component => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    statusConfig={STATUS_CONFIG}
                    onStatusChange={handleStatusChange}
                    onEdit={() => setEditingComponent(component)}
                    onDelete={() => handleDeleteComponent(component.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Ungrouped components */}
          {ungroupedComponents.length > 0 && (
            <div className="component-group">
              <div className="group-header">
                <h2>Ungrouped</h2>
                <span className="component-count">{ungroupedComponents.length} components</span>
              </div>
              <div className="component-cards">
                {ungroupedComponents.map(component => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    statusConfig={STATUS_CONFIG}
                    onStatusChange={handleStatusChange}
                    onEdit={() => setEditingComponent(component)}
                    onDelete={() => handleDeleteComponent(component.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showComponentModal && (
        <ComponentModal
          groups={groups}
          onSave={handleAddComponent}
          onClose={() => setShowComponentModal(false)}
        />
      )}

      {editingComponent && (
        <ComponentModal
          component={editingComponent}
          groups={groups}
          onSave={handleEditComponent}
          onClose={() => setEditingComponent(null)}
        />
      )}

      {showGroupModal && (
        <GroupModal
          onSave={handleAddGroup}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
}
```

### Component Card
```tsx
// src/components/dashboard/ComponentCard.tsx
interface Props {
  component: Component;
  statusConfig: Record<ComponentStatus, { label: string; color: string }>;
  onStatusChange: (id: string, status: ComponentStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ComponentCard({ component, statusConfig, onStatusChange, onEdit, onDelete }: Props) {
  const status = statusConfig[component.status];

  return (
    <div className="component-card">
      <div className="component-info">
        <div className="status-indicator" style={{ backgroundColor: status.color }} />
        <div className="component-details">
          <h3>{component.name}</h3>
          {component.description && <p>{component.description}</p>}
        </div>
      </div>

      <div className="component-actions">
        <select
          value={component.status}
          onChange={(e) => onStatusChange(component.id, e.target.value as ComponentStatus)}
          className="status-select"
        >
          {Object.entries(statusConfig).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>

        <div className="action-buttons">
          <button className="btn btn-icon" onClick={onEdit} title="Edit">
            <span className="icon-edit" />
          </button>
          <button className="btn btn-icon btn-danger" onClick={onDelete} title="Delete">
            <span className="icon-trash" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### CSS
```css
/* Component list styles */
.component-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.component-group {
  margin-bottom: 32px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.component-count {
  color: #6b7280;
  font-size: 14px;
}

.component-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.component-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  background: #ffffff;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}
```

---

## Testing

- [ ] Components displayed correctly
- [ ] Components grouped by group
- [ ] Ungrouped components shown separately
- [ ] Status indicator colors correct
- [ ] Quick status change works
- [ ] Add component button works
- [ ] Add group button works
- [ ] Empty state shown when no components
- [ ] Component count accurate

---

## Files to Create/Modify

- `src/pages/app/[pageId]/components/index.astro`
- `src/components/dashboard/ComponentList.tsx`
- `src/components/dashboard/ComponentCard.tsx`
- `src/styles/components.css`
