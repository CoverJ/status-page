# DT-004: Database Repository Layer

**Epic:** Foundation & Infrastructure
**Priority:** Critical
**Estimate:** Medium
**Dependencies:** DT-002, DT-003

---

## Description

Create type-safe repository functions for all database operations, providing a clean data access layer that abstracts Drizzle queries.

---

## Acceptance Criteria

- [ ] `PageRepository` with CRUD operations + findBySubdomain
- [ ] `ComponentRepository` with CRUD + findByPageId + reorder
- [ ] `ComponentGroupRepository` with CRUD + findByPageId
- [ ] `IncidentRepository` with CRUD + findByPageId + findUnresolved + findScheduled
- [ ] `IncidentUpdateRepository` with create + findByIncidentId
- [ ] `SubscriberRepository` with CRUD + findByPageId + findConfirmed
- [ ] `UserRepository` with CRUD + findByEmail
- [ ] `SessionRepository` with create + findValid + delete + deleteExpired
- [ ] All repositories return typed results using Drizzle inference
- [ ] All repositories accept D1 database instance as parameter

---

## Technical Notes

### Repository Pattern
```typescript
// src/db/repositories/types.ts
import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../schema';

export type Database = DrizzleD1Database<typeof schema>;

// Base repository interface
export interface Repository<T, CreateInput, UpdateInput> {
  findById(db: Database, id: string): Promise<T | null>;
  create(db: Database, data: CreateInput): Promise<T>;
  update(db: Database, id: string, data: UpdateInput): Promise<T | null>;
  delete(db: Database, id: string): Promise<boolean>;
}
```

### Page Repository
```typescript
// src/db/repositories/pages.ts
import { eq } from 'drizzle-orm';
import { pages } from '../schema';
import type { Database } from './types';

export const PageRepository = {
  async findById(db: Database, id: string) {
    const result = await db.select().from(pages).where(eq(pages.id, id)).get();
    return result ?? null;
  },

  async findBySubdomain(db: Database, subdomain: string) {
    const result = await db.select().from(pages).where(eq(pages.subdomain, subdomain)).get();
    return result ?? null;
  },

  async create(db: Database, data: typeof pages.$inferInsert) {
    const result = await db.insert(pages).values(data).returning().get();
    return result;
  },

  async update(db: Database, id: string, data: Partial<typeof pages.$inferInsert>) {
    const result = await db
      .update(pages)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(pages.id, id))
      .returning()
      .get();
    return result ?? null;
  },

  async delete(db: Database, id: string) {
    const result = await db.delete(pages).where(eq(pages.id, id)).returning().get();
    return result !== undefined;
  },

  async subdomainExists(db: Database, subdomain: string, excludeId?: string) {
    const query = db.select({ id: pages.id }).from(pages).where(eq(pages.subdomain, subdomain));
    const result = await query.get();
    if (!result) return false;
    if (excludeId && result.id === excludeId) return false;
    return true;
  },
};
```

### Incident Repository
```typescript
// src/db/repositories/incidents.ts
import { eq, and, inArray, desc } from 'drizzle-orm';
import { incidents, incidentUpdates, incidentComponents } from '../schema';
import type { Database } from './types';

const RESOLVED_STATUSES = ['resolved', 'completed'] as const;
const UNRESOLVED_STATUSES = ['investigating', 'identified', 'monitoring', 'in_progress', 'verifying'] as const;
const SCHEDULED_STATUSES = ['scheduled'] as const;

export const IncidentRepository = {
  async findById(db: Database, id: string) {
    return db.select().from(incidents).where(eq(incidents.id, id)).get() ?? null;
  },

  async findByPageId(db: Database, pageId: string, options?: { limit?: number; offset?: number }) {
    return db
      .select()
      .from(incidents)
      .where(eq(incidents.pageId, pageId))
      .orderBy(desc(incidents.createdAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0)
      .all();
  },

  async findUnresolved(db: Database, pageId: string) {
    return db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.pageId, pageId),
        inArray(incidents.status, [...UNRESOLVED_STATUSES])
      ))
      .orderBy(desc(incidents.createdAt))
      .all();
  },

  async findScheduled(db: Database, pageId: string) {
    return db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.pageId, pageId),
        inArray(incidents.status, [...SCHEDULED_STATUSES])
      ))
      .orderBy(incidents.scheduledFor)
      .all();
  },

  async findResolved(db: Database, pageId: string, options?: { limit?: number; offset?: number }) {
    return db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.pageId, pageId),
        inArray(incidents.status, [...RESOLVED_STATUSES])
      ))
      .orderBy(desc(incidents.resolvedAt))
      .limit(options?.limit ?? 20)
      .offset(options?.offset ?? 0)
      .all();
  },

  async create(db: Database, data: typeof incidents.$inferInsert) {
    return db.insert(incidents).values(data).returning().get();
  },

  async update(db: Database, id: string, data: Partial<typeof incidents.$inferInsert>) {
    return db
      .update(incidents)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(incidents.id, id))
      .returning()
      .get() ?? null;
  },

  async delete(db: Database, id: string) {
    const result = await db.delete(incidents).where(eq(incidents.id, id)).returning().get();
    return result !== undefined;
  },

  // Get incident with all updates
  async findWithUpdates(db: Database, id: string) {
    const incident = await this.findById(db, id);
    if (!incident) return null;

    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, id))
      .orderBy(desc(incidentUpdates.displayAt))
      .all();

    return { ...incident, updates };
  },
};
```

### Session Repository
```typescript
// src/db/repositories/sessions.ts
import { eq, and, gt, lt } from 'drizzle-orm';
import { sessions } from '../schema';
import type { Database } from './types';

export const SessionRepository = {
  async findById(db: Database, id: string) {
    return db.select().from(sessions).where(eq(sessions.id, id)).get() ?? null;
  },

  async findValid(db: Database, id: string) {
    const now = new Date().toISOString();
    return db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
      .get() ?? null;
  },

  async create(db: Database, data: typeof sessions.$inferInsert) {
    return db.insert(sessions).values(data).returning().get();
  },

  async delete(db: Database, id: string) {
    const result = await db.delete(sessions).where(eq(sessions.id, id)).returning().get();
    return result !== undefined;
  },

  async deleteExpired(db: Database) {
    const now = new Date().toISOString();
    await db.delete(sessions).where(lt(sessions.expiresAt, now));
  },

  async deleteAllForUser(db: Database, userId: string) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  },

  async extendExpiry(db: Database, id: string, newExpiresAt: string) {
    return db
      .update(sessions)
      .set({ expiresAt: newExpiresAt })
      .where(eq(sessions.id, id))
      .returning()
      .get() ?? null;
  },
};
```

### Database Helper
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export * from './repositories';
export * from './schema';
```

---

## Testing

- [ ] Each repository method works correctly
- [ ] Type inference works (no `any` types)
- [ ] Null returned for not-found records
- [ ] Filters work correctly (findUnresolved, findScheduled)
- [ ] Pagination works (limit/offset)

---

## Files to Create/Modify

- `src/db/repositories/types.ts`
- `src/db/repositories/pages.ts`
- `src/db/repositories/components.ts`
- `src/db/repositories/component-groups.ts`
- `src/db/repositories/incidents.ts`
- `src/db/repositories/incident-updates.ts`
- `src/db/repositories/users.ts`
- `src/db/repositories/sessions.ts`
- `src/db/repositories/subscribers.ts`
- `src/db/repositories/index.ts`
- `src/db/index.ts`
