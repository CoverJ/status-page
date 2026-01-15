# DT-034: Email Delivery Tracking & Quarantine

**Epic:** Email Notifications
**Priority:** Medium
**Estimate:** Medium
**Dependencies:** DT-031, DT-032

---

## Description

Implement email delivery tracking to monitor notification delivery status and a quarantine system for handling bounced or invalid email addresses.

---

## Acceptance Criteria

- [ ] Track email send attempts and results
- [ ] Record delivery status from Resend webhooks
- [ ] Auto-quarantine after repeated bounces (3 bounces)
- [ ] Auto-quarantine for hard bounces immediately
- [ ] Dashboard view of email delivery stats
- [ ] Dashboard view of quarantined emails
- [ ] Manual unquarantine option
- [ ] Exclude quarantined addresses from notifications
- [ ] Email delivery history per subscriber

---

## Technical Notes

### Email Log Schema
```typescript
// src/db/schema.ts (addition)
export const emailLogs = sqliteTable('email_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  subscriberId: text('subscriber_id').references(() => subscribers.id, { onDelete: 'cascade' }),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  type: text('type').notNull(), // 'incident', 'maintenance', 'confirmation'
  subject: text('subject').notNull(),
  resendId: text('resend_id'),
  status: text('status').notNull().default('pending'), // 'pending', 'sent', 'delivered', 'bounced', 'complained'
  errorMessage: text('error_message'),
  sentAt: text('sent_at'),
  deliveredAt: text('delivered_at'),
  bouncedAt: text('bounced_at'),
  bounceType: text('bounce_type'), // 'hard', 'soft'
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const emailQuarantine = sqliteTable('email_quarantine', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  reason: text('reason').notNull(), // 'hard_bounce', 'soft_bounce', 'complaint', 'manual'
  bounceCount: integer('bounce_count').notNull().default(0),
  quarantinedAt: text('quarantined_at').notNull().$defaultFn(() => new Date().toISOString()),
  unquarantinedAt: text('unquarantined_at'),
  notes: text('notes'),
});
```

### Email Log Repository
```typescript
// src/db/repositories/email-logs.ts
import { eq, and, desc, gte } from 'drizzle-orm';
import { emailLogs, emailQuarantine } from '../schema';
import type { Database } from './types';

export const EmailLogRepository = {
  async create(db: Database, data: typeof emailLogs.$inferInsert) {
    return db.insert(emailLogs).values(data).returning().get();
  },

  async updateByResendId(db: Database, resendId: string, data: Partial<typeof emailLogs.$inferInsert>) {
    return db
      .update(emailLogs)
      .set(data)
      .where(eq(emailLogs.resendId, resendId))
      .returning()
      .get();
  },

  async findByPageId(db: Database, pageId: string, options?: { limit?: number; offset?: number }) {
    return db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.pageId, pageId))
      .orderBy(desc(emailLogs.createdAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0)
      .all();
  },

  async findBySubscriberId(db: Database, subscriberId: string) {
    return db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.subscriberId, subscriberId))
      .orderBy(desc(emailLogs.createdAt))
      .all();
  },

  async getStats(db: Database, pageId: string, since: string) {
    const logs = await db
      .select()
      .from(emailLogs)
      .where(and(eq(emailLogs.pageId, pageId), gte(emailLogs.createdAt, since)))
      .all();

    return {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
      delivered: logs.filter(l => l.status === 'delivered').length,
      bounced: logs.filter(l => l.status === 'bounced').length,
      pending: logs.filter(l => l.status === 'pending').length,
    };
  },
};

export const QuarantineRepository = {
  async create(db: Database, data: typeof emailQuarantine.$inferInsert) {
    return db.insert(emailQuarantine).values(data).returning().get();
  },

  async findByEmail(db: Database, pageId: string, email: string) {
    return db
      .select()
      .from(emailQuarantine)
      .where(and(
        eq(emailQuarantine.pageId, pageId),
        eq(emailQuarantine.email, email.toLowerCase()),
        isNull(emailQuarantine.unquarantinedAt)
      ))
      .get();
  },

  async findByPageId(db: Database, pageId: string) {
    return db
      .select()
      .from(emailQuarantine)
      .where(and(
        eq(emailQuarantine.pageId, pageId),
        isNull(emailQuarantine.unquarantinedAt)
      ))
      .orderBy(desc(emailQuarantine.quarantinedAt))
      .all();
  },

  async unquarantine(db: Database, id: string) {
    return db
      .update(emailQuarantine)
      .set({ unquarantinedAt: new Date().toISOString() })
      .where(eq(emailQuarantine.id, id))
      .returning()
      .get();
  },

  async isQuarantined(db: Database, pageId: string, email: string): Promise<boolean> {
    const record = await this.findByEmail(db, pageId, email);
    return record !== null;
  },

  async incrementBounceCount(db: Database, pageId: string, email: string): Promise<number> {
    const existing = await this.findByEmail(db, pageId, email);

    if (existing) {
      const updated = await db
        .update(emailQuarantine)
        .set({ bounceCount: existing.bounceCount + 1 })
        .where(eq(emailQuarantine.id, existing.id))
        .returning()
        .get();
      return updated.bounceCount;
    }

    // Create new record with count 1
    const created = await this.create(db, {
      pageId,
      email: email.toLowerCase(),
      reason: 'soft_bounce',
      bounceCount: 1,
    });
    return created.bounceCount;
  },
};
```

### Resend Webhook Handler
```typescript
// src/pages/api/webhooks/resend.ts
import type { APIRoute } from 'astro';
import { createDb, EmailLogRepository, QuarantineRepository, SubscriberRepository } from '@/db';
import { verifyResendWebhook } from '@/lib/email/webhooks';

const SOFT_BOUNCE_THRESHOLD = 3;

export const POST: APIRoute = async (context) => {
  const signature = context.request.headers.get('svix-signature');
  const timestamp = context.request.headers.get('svix-timestamp');
  const webhookId = context.request.headers.get('svix-id');

  const body = await context.request.text();

  // Verify webhook signature
  const isValid = await verifyResendWebhook(
    body,
    { signature, timestamp, webhookId },
    context.locals.runtime.env.RESEND_WEBHOOK_SECRET
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  const db = createDb(context.locals.runtime.env.DB);

  switch (event.type) {
    case 'email.sent':
      await EmailLogRepository.updateByResendId(db, event.data.email_id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      break;

    case 'email.delivered':
      await EmailLogRepository.updateByResendId(db, event.data.email_id, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      });
      break;

    case 'email.bounced':
      const log = await EmailLogRepository.updateByResendId(db, event.data.email_id, {
        status: 'bounced',
        bouncedAt: new Date().toISOString(),
        bounceType: event.data.bounce?.type || 'hard',
        errorMessage: event.data.bounce?.message,
      });

      if (log) {
        await handleBounce(db, log.pageId, log.email, event.data.bounce?.type);
      }
      break;

    case 'email.complained':
      const complainedLog = await EmailLogRepository.updateByResendId(db, event.data.email_id, {
        status: 'complained',
      });

      if (complainedLog) {
        await QuarantineRepository.create(db, {
          pageId: complainedLog.pageId,
          email: complainedLog.email,
          reason: 'complaint',
        });

        // Unsubscribe the complainant
        await SubscriberRepository.unsubscribeByEmail(db, complainedLog.pageId, complainedLog.email);
      }
      break;
  }

  return new Response('OK', { status: 200 });
};

async function handleBounce(db: Database, pageId: string, email: string, bounceType: string) {
  if (bounceType === 'hard') {
    // Immediately quarantine hard bounces
    await QuarantineRepository.create(db, {
      pageId,
      email,
      reason: 'hard_bounce',
    });

    // Unsubscribe
    await SubscriberRepository.unsubscribeByEmail(db, pageId, email);
  } else {
    // Soft bounce - increment counter
    const count = await QuarantineRepository.incrementBounceCount(db, pageId, email);

    if (count >= SOFT_BOUNCE_THRESHOLD) {
      // Auto-quarantine after threshold
      await QuarantineRepository.create(db, {
        pageId,
        email,
        reason: 'soft_bounce',
        bounceCount: count,
      });
    }
  }
}
```

### Filter Quarantined from Notifications
```typescript
// src/lib/email/queue.ts (modification)
async function sendIncidentNotifications(...) {
  // ... existing code

  // Filter out quarantined emails
  const activeSubscribers = [];
  for (const subscriber of subscribers) {
    const isQuarantined = await QuarantineRepository.isQuarantined(db, page.id, subscriber.email);
    if (!isQuarantined) {
      activeSubscribers.push(subscriber);
    }
  }

  if (activeSubscribers.length === 0) return;

  // ... continue with activeSubscribers
}
```

### Admin Email Stats API
```typescript
// src/pages/api/pages/[pageId]/email-stats.ts
import type { APIRoute } from 'astro';
import { requirePageAccess } from '@/lib/auth/guards';
import { createDb, EmailLogRepository, QuarantineRepository } from '@/db';

export const GET: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requirePageAccess(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);

  // Stats for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const stats = await EmailLogRepository.getStats(db, pageId, thirtyDaysAgo.toISOString());
  const quarantined = await QuarantineRepository.findByPageId(db, pageId);

  return new Response(JSON.stringify({
    stats,
    quarantinedCount: quarantined.length,
    deliveryRate: stats.total > 0 ? (stats.delivered / stats.total * 100).toFixed(1) : 0,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

## Testing

- [ ] Email logs created on send
- [ ] Webhook updates log status
- [ ] Hard bounce triggers immediate quarantine
- [ ] Soft bounces counted correctly
- [ ] Auto-quarantine at threshold
- [ ] Quarantined emails excluded from sends
- [ ] Stats calculation correct
- [ ] Unquarantine works correctly
- [ ] Webhook signature validation works
- [ ] Complaint handling works

---

## Files to Create/Modify

- `src/db/schema.ts` (add email_logs, email_quarantine tables)
- `src/db/repositories/email-logs.ts`
- `src/pages/api/webhooks/resend.ts`
- `src/lib/email/webhooks.ts` (signature verification)
- `src/lib/email/queue.ts` (filter quarantined)
- `src/pages/api/pages/[pageId]/email-stats.ts`
- `src/pages/api/pages/[pageId]/quarantine.ts`
