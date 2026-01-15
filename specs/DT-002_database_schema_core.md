# DT-002: Database Schema - Core Entities

**Epic:** Foundation & Infrastructure
**Priority:** Critical
**Estimate:** Medium
**Dependencies:** DT-001

---

## Description

Define and implement the Drizzle ORM schema for all core entities: pages, components, component groups, incidents, and incident updates.

---

## Acceptance Criteria

- [ ] `pages` table with all attributes from spec
- [ ] `components` table with status enum and positioning
- [ ] `component_groups` table for organizing components
- [ ] `incidents` table supporting both incidents and maintenance
- [ ] `incident_updates` table for timeline entries
- [ ] `incident_components` junction table for affected components
- [ ] Foreign key constraints defined
- [ ] Indexes on frequently queried columns
- [ ] Migration files generated and tested locally

---

## Technical Notes

### Pages Table
```typescript
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  customDomain: text('custom_domain'),
  statusIndicator: text('status_indicator', {
    enum: ['none', 'minor', 'major', 'critical']
  }).default('none'),
  statusDescription: text('status_description').default('All Systems Operational'),
  timezone: text('timezone').default('UTC'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
```

### Components Table
```typescript
export const componentStatus = ['operational', 'degraded_performance', 'partial_outage', 'major_outage', 'under_maintenance'] as const;

export const components = sqliteTable('components', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  groupId: text('group_id').references(() => componentGroups.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: componentStatus }).default('operational'),
  position: integer('position').default(0),
  showcase: integer('showcase', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
```

### Component Groups Table
```typescript
export const componentGroups = sqliteTable('component_groups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').default(0),
  expanded: integer('expanded', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
```

### Incidents Table
```typescript
export const incidentStatus = ['investigating', 'identified', 'monitoring', 'resolved', 'scheduled', 'in_progress', 'verifying', 'completed'] as const;
export const incidentImpact = ['none', 'minor', 'major', 'critical', 'maintenance'] as const;

export const incidents = sqliteTable('incidents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status', { enum: incidentStatus }).notNull(),
  impact: text('impact', { enum: incidentImpact }).notNull(),
  scheduledFor: text('scheduled_for'),
  scheduledUntil: text('scheduled_until'),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
```

### Incident Updates Table
```typescript
export const incidentUpdates = sqliteTable('incident_updates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  incidentId: text('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  status: text('status', { enum: incidentStatus }).notNull(),
  body: text('body').notNull(),
  displayAt: text('display_at').$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
```

### Incident Components Junction
```typescript
export const incidentComponents = sqliteTable('incident_components', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  incidentId: text('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  componentId: text('component_id').notNull().references(() => components.id, { onDelete: 'cascade' }),
  oldStatus: text('old_status', { enum: componentStatus }),
  newStatus: text('new_status', { enum: componentStatus }),
});
```

### Indexes
```typescript
export const pagesSubdomainIdx = index('pages_subdomain_idx').on(pages.subdomain);
export const componentsPageIdx = index('components_page_idx').on(components.pageId);
export const incidentsPageIdx = index('incidents_page_idx').on(incidents.pageId);
export const incidentsStatusIdx = index('incidents_status_idx').on(incidents.status);
```

---

## Testing

- [ ] Migrations generate without errors: `npx drizzle-kit generate`
- [ ] Migrations apply to local D1: `npx wrangler d1 migrations apply`
- [ ] Can insert and query all entity types
- [ ] Foreign key constraints enforced
- [ ] Cascade deletes work correctly

---

## Files to Create/Modify

- `src/db/schema/pages.ts`
- `src/db/schema/components.ts`
- `src/db/schema/incidents.ts`
- `src/db/schema/index.ts` (barrel export)
- `drizzle.config.ts`
- `drizzle/migrations/*.sql` (generated)
