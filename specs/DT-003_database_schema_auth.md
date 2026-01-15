# DT-003: Database Schema - Auth & Subscribers

**Epic:** Foundation & Infrastructure
**Priority:** Critical
**Estimate:** Medium
**Dependencies:** DT-001, DT-002

---

## Description

Define Drizzle ORM schema for authentication tables (users, sessions, magic links, team members) and subscriber management tables.

---

## Acceptance Criteria

- [ ] `users` table with email, password hash, profile info
- [ ] `sessions` table for session management
- [ ] `magic_links` table for passwordless auth tokens
- [ ] `team_members` table linking users to pages with roles
- [ ] `team_invitations` table for pending invites
- [ ] `subscribers` table with email and component subscriptions
- [ ] `subscriber_confirmations` table for double opt-in tokens
- [ ] Indexes on email fields and foreign keys
- [ ] Migration files generated

---

## Technical Notes

### Users Table
```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // null for magic-link-only users
  name: text('name'),
  emailVerifiedAt: text('email_verified_at'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text('last_login_at'),
});
```

### Sessions Table
```typescript
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});
```

### Magic Links Table
```typescript
export const magicLinks = sqliteTable('magic_links', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
```

### Team Members Table
```typescript
export const teamMemberRole = ['owner', 'admin', 'member'] as const;

export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: teamMemberRole }).notNull().default('member'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniquePageUser: unique().on(table.pageId, table.userId),
}));
```

### Team Invitations Table
```typescript
export const teamInvitations = sqliteTable('team_invitations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: teamMemberRole }).notNull().default('member'),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  acceptedAt: text('accepted_at'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  invitedBy: text('invited_by').references(() => users.id),
});
```

### Subscribers Table
```typescript
export const subscribers = sqliteTable('subscribers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  componentIds: text('component_ids'), // JSON array or null for all
  confirmedAt: text('confirmed_at'),
  quarantinedAt: text('quarantined_at'),
  unsubscribedAt: text('unsubscribed_at'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniquePageEmail: unique().on(table.pageId, table.email),
}));
```

### Subscriber Confirmations Table
```typescript
export const subscriberConfirmations = sqliteTable('subscriber_confirmations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriberId: text('subscriber_id').notNull().references(() => subscribers.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});
```

### Indexes
```typescript
export const usersEmailIdx = index('users_email_idx').on(users.email);
export const sessionsUserIdx = index('sessions_user_idx').on(sessions.userId);
export const magicLinksTokenIdx = index('magic_links_token_idx').on(magicLinks.token);
export const teamMembersPageIdx = index('team_members_page_idx').on(teamMembers.pageId);
export const teamMembersUserIdx = index('team_members_user_idx').on(teamMembers.userId);
export const subscribersPageIdx = index('subscribers_page_idx').on(subscribers.pageId);
export const subscribersEmailIdx = index('subscribers_email_idx').on(subscribers.email);
```

---

## Testing

- [ ] Migrations generate and apply successfully
- [ ] Unique constraints enforced (duplicate email, duplicate page+user)
- [ ] Cascade deletes work (user deleted -> sessions deleted)
- [ ] Can query team members for a page
- [ ] Can query subscribers for a page

---

## Files to Create/Modify

- `src/db/schema/users.ts`
- `src/db/schema/sessions.ts`
- `src/db/schema/team.ts`
- `src/db/schema/subscribers.ts`
- `src/db/schema/index.ts` (update barrel export)
