# DT-031: Resend Email Integration

**Epic:** Email Notifications
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004, DT-029

---

## Description

Set up Resend email service integration for sending transactional emails including incident notifications, maintenance alerts, and subscriber confirmations.

---

## Acceptance Criteria

- [ ] Resend SDK configured with API key
- [ ] Email service abstraction layer
- [ ] Email templates for all notification types
- [ ] HTML and plain text versions of emails
- [ ] Email queue using Cloudflare Queues
- [ ] Retry logic for failed sends
- [ ] Environment-based configuration (dev/prod)
- [ ] Email preview in development mode

---

## Technical Notes

### Email Service Configuration
```typescript
// src/lib/email/config.ts
interface EmailConfig {
  apiKey: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
}

export function getEmailConfig(env: Env): EmailConfig {
  return {
    apiKey: env.RESEND_API_KEY,
    fromAddress: env.EMAIL_FROM_ADDRESS || 'notifications@downtime.online',
    fromName: env.EMAIL_FROM_NAME || 'Downtime.online',
    replyTo: env.EMAIL_REPLY_TO,
  };
}
```

### Email Service Client
```typescript
// src/lib/email/client.ts
import { Resend } from 'resend';
import { getEmailConfig } from './config';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private client: Resend;
  private config: ReturnType<typeof getEmailConfig>;

  constructor(env: Env) {
    this.config = getEmailConfig(env);
    this.client = new Resend(this.config.apiKey);
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const result = await this.client.emails.send({
        from: `${this.config.fromName} <${this.config.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: this.config.replyTo,
        tags: options.tags,
        headers: options.headers,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    // Resend supports batch sending up to 100 emails
    const batches = chunk(emails, 100);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(email => this.send(email))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### Email Queue Worker
```typescript
// src/lib/email/queue.ts
import { EmailService } from './client';
import { renderIncidentEmail, renderMaintenanceEmail, renderConfirmationEmail } from './templates';
import { createDb, SubscriberRepository, IncidentRepository, PageRepository } from '@/db';

interface EmailQueueMessage {
  type: 'incident_notification' | 'maintenance_notification' | 'confirmation';
  incidentId?: string;
  pageId: string;
  subscriberId?: string;
  action?: 'created' | 'updated' | 'resolved';
  token?: string;
}

export async function processEmailQueue(
  batch: MessageBatch<EmailQueueMessage>,
  env: Env
): Promise<void> {
  const db = createDb(env.DB);
  const emailService = new EmailService(env);

  for (const message of batch.messages) {
    try {
      await processMessage(message.body, db, emailService, env);
      message.ack();
    } catch (error) {
      console.error('Failed to process email message:', error);
      // Retry up to 3 times
      if (message.retryCount < 3) {
        message.retry({ delaySeconds: Math.pow(2, message.retryCount) * 60 });
      } else {
        // Move to dead letter queue
        message.ack();
        await logFailedEmail(db, message.body, error);
      }
    }
  }
}

async function processMessage(
  message: EmailQueueMessage,
  db: Database,
  emailService: EmailService,
  env: Env
): Promise<void> {
  const page = await PageRepository.findById(db, message.pageId);
  if (!page) {
    throw new Error(`Page not found: ${message.pageId}`);
  }

  switch (message.type) {
    case 'incident_notification':
      await sendIncidentNotifications(message, db, emailService, page);
      break;

    case 'maintenance_notification':
      await sendMaintenanceNotifications(message, db, emailService, page);
      break;

    case 'confirmation':
      await sendConfirmationEmail(message, emailService, page, env);
      break;
  }
}

async function sendIncidentNotifications(
  message: EmailQueueMessage,
  db: Database,
  emailService: EmailService,
  page: Page
): Promise<void> {
  const incident = await IncidentRepository.findWithUpdates(db, message.incidentId!);
  if (!incident) return;

  // Get active subscribers
  const subscribers = await SubscriberRepository.findActiveForIncident(
    db,
    page.id,
    incident.affectedComponentIds
  );

  if (subscribers.length === 0) return;

  // Render email template
  const emails = subscribers.map(subscriber => {
    const { html, text, subject } = renderIncidentEmail({
      incident,
      page,
      action: message.action!,
      subscriber,
    });

    return {
      to: subscriber.email,
      subject,
      html,
      text,
      tags: [
        { name: 'type', value: 'incident' },
        { name: 'pageId', value: page.id },
        { name: 'incidentId', value: incident.id },
      ],
      headers: {
        'List-Unsubscribe': `<https://${page.subdomain}.downtime.online/unsubscribe/${subscriber.manageToken}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  });

  await emailService.sendBatch(emails);
}
```

### Email Templates Base
```typescript
// src/lib/email/templates/base.ts
export const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background-color: #f9fafb;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .card {
    background: #ffffff;
    border-radius: 8px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .header {
    text-align: center;
    margin-bottom: 24px;
  }
  .title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
  }
  .status-investigating { background: #fef3c7; color: #92400e; }
  .status-identified { background: #fef3c7; color: #92400e; }
  .status-monitoring { background: #dbeafe; color: #1e40af; }
  .status-resolved { background: #d1fae5; color: #065f46; }
  .content {
    margin: 24px 0;
  }
  .footer {
    text-align: center;
    font-size: 13px;
    color: #6b7280;
    margin-top: 32px;
  }
  .footer a {
    color: #6b7280;
  }
  .button {
    display: inline-block;
    padding: 12px 24px;
    background: #1f2937;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
  }
`;

export function wrapHtml(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      ${content}
    </div>
  </div>
</body>
</html>
  `.trim();
}
```

### Queue Binding Configuration
```toml
# wrangler.toml addition
[[queues.producers]]
queue = "email-queue"
binding = "EMAIL_QUEUE"

[[queues.consumers]]
queue = "email-queue"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "email-dlq"
```

---

## Testing

- [ ] Resend client initializes correctly
- [ ] Send single email succeeds
- [ ] Batch send works for multiple recipients
- [ ] Queue processes messages
- [ ] Retry logic works on failure
- [ ] Dead letter queue receives failed messages
- [ ] Templates render correctly
- [ ] HTML and text versions match
- [ ] Unsubscribe headers present

---

## Files to Create/Modify

- `src/lib/email/config.ts`
- `src/lib/email/client.ts`
- `src/lib/email/queue.ts`
- `src/lib/email/templates/base.ts`
- `src/lib/email/index.ts`
- `wrangler.toml` (queue configuration)
- `src/workers/email-queue.ts`
