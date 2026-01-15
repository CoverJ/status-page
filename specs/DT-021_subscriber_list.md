# DT-021: Subscriber List View

**Epic:** Admin Dashboard - Subscriber Management
**Priority:** Medium
**Estimate:** Medium
**Dependencies:** DT-004, DT-008

---

## Description

Build the subscriber list view with filtering, search, pagination, and bulk actions.

---

## Acceptance Criteria

- [ ] List all subscribers with email, status, subscribed components, created date
- [ ] Status indicators: confirmed, pending, unsubscribed, quarantined
- [ ] Filter by status
- [ ] Search by email
- [ ] Pagination (50 per page)
- [ ] Bulk actions: remove selected, export CSV
- [ ] "Add Subscriber" button
- [ ] Empty state when no subscribers

---

## Technical Notes

### Subscriber List Page
```astro
// src/pages/app/[pageId]/subscribers/index.astro
---
import { requirePageAccess } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import SubscriberList from '@/components/dashboard/SubscriberList';
import { createDb, SubscriberRepository, ComponentRepository, PageRepository } from '@/db';

const { pageId } = Astro.params;
const authResponse = await requirePageAccess(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);
const page = await PageRepository.findById(db, pageId);
const subscribers = await SubscriberRepository.findByPageId(db, pageId, { limit: 50 });
const components = await ComponentRepository.findByPageId(db, pageId);
const counts = await SubscriberRepository.getStatusCounts(db, pageId);

const { user, membership } = Astro.locals;
---

<DashboardLayout pageId={pageId} pageName={page.name} user={user} role={membership.role} title="Subscribers">
  <SubscriberList
    client:load
    pageId={pageId}
    initialSubscribers={subscribers}
    components={components}
    counts={counts}
  />
</DashboardLayout>
```

### Subscriber List Component
```tsx
// src/components/dashboard/SubscriberList.tsx
import { useState, useEffect } from 'react';

interface Subscriber {
  id: string;
  email: string;
  componentIds: string | null;
  confirmedAt: string | null;
  quarantinedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
}

interface Component {
  id: string;
  name: string;
}

interface Props {
  pageId: string;
  initialSubscribers: Subscriber[];
  components: Component[];
  counts: { confirmed: number; pending: number; unsubscribed: number; quarantined: number };
}

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'unsubscribed' | 'quarantined';

export function SubscriberList({ pageId, initialSubscribers, components, counts }: Props) {
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch subscribers when filter/search/page changes
  useEffect(() => {
    const controller = new AbortController();
    fetchSubscribers(controller.signal);
    return () => controller.abort();
  }, [statusFilter, searchQuery, page]);

  async function fetchSubscribers(signal?: AbortSignal) {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
    });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);

    try {
      const response = await fetch(`/api/pages/${pageId}/subscribers?${params}`, { signal });
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to fetch subscribers');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function getStatus(subscriber: Subscriber): StatusFilter {
    if (subscriber.unsubscribedAt) return 'unsubscribed';
    if (subscriber.quarantinedAt) return 'quarantined';
    if (subscriber.confirmedAt) return 'confirmed';
    return 'pending';
  }

  function getComponentNames(subscriber: Subscriber): string {
    if (!subscriber.componentIds) return 'All components';
    const ids = JSON.parse(subscriber.componentIds);
    return ids
      .map((id: string) => components.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'None';
  }

  async function handleBulkRemove() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Remove ${selectedIds.size} subscriber(s)?`)) return;

    const response = await fetch(`/api/pages/${pageId}/subscribers/bulk-remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    if (response.ok) {
      setSubscribers(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    }
  }

  async function handleExport() {
    window.location.href = `/api/pages/${pageId}/subscribers/export`;
  }

  return (
    <div className="subscriber-list-container">
      <div className="subscriber-header">
        <h1>Subscribers ({counts.confirmed + counts.pending})</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          Add Subscriber
        </button>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All
        </button>
        <button
          className={`tab ${statusFilter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('confirmed')}
        >
          Confirmed ({counts.confirmed})
        </button>
        <button
          className={`tab ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`tab ${statusFilter === 'unsubscribed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('unsubscribed')}
        >
          Unsubscribed ({counts.unsubscribed})
        </button>
        <button
          className={`tab ${statusFilter === 'quarantined' ? 'active' : ''}`}
          onClick={() => setStatusFilter('quarantined')}
        >
          Quarantined ({counts.quarantined})
        </button>
      </div>

      {/* Search & Actions */}
      <div className="subscriber-toolbar">
        <input
          type="search"
          placeholder="Search by email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <div className="bulk-actions">
          {selectedIds.size > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleBulkRemove}>
              Remove Selected ({selectedIds.size})
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Subscriber Table */}
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : subscribers.length === 0 ? (
        <EmptyState />
      ) : (
        <table className="subscriber-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedIds.size === subscribers.length}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(subscribers.map(s => s.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
              </th>
              <th>Email</th>
              <th>Status</th>
              <th>Components</th>
              <th>Subscribed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(subscriber => (
              <SubscriberRow
                key={subscriber.id}
                subscriber={subscriber}
                status={getStatus(subscriber)}
                componentNames={getComponentNames(subscriber)}
                isSelected={selectedIds.has(subscriber.id)}
                onSelect={checked => {
                  setSelectedIds(prev => {
                    const next = new Set(prev);
                    if (checked) next.add(subscriber.id);
                    else next.delete(subscriber.id);
                    return next;
                  });
                }}
                pageId={pageId}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {subscribers.length >= 50 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Testing

- [ ] Subscribers displayed correctly
- [ ] Status filters work
- [ ] Search filters by email
- [ ] Pagination works
- [ ] Bulk selection works
- [ ] Bulk remove works
- [ ] Export CSV downloads file
- [ ] Add subscriber button opens modal
- [ ] Status badges show correctly

---

## Files to Create/Modify

- `src/pages/app/[pageId]/subscribers/index.astro`
- `src/components/dashboard/SubscriberList.tsx`
- `src/components/dashboard/SubscriberRow.tsx`
- `src/db/repositories/subscribers.ts` (add getStatusCounts)
- `src/styles/subscribers.css`
