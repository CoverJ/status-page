# DT-006: Magic Link Authentication

**Epic:** Authentication System
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-003, DT-004, DT-031 (email service)

---

## Description

Implement passwordless login via email magic links, allowing users to sign in by clicking a link sent to their email.

---

## Acceptance Criteria

- [ ] Magic link generation endpoint (creates token, queues email)
- [ ] Magic link verification endpoint (validates token, creates session)
- [ ] Token format: 32-byte random hex string
- [ ] Token expiry: 15 minutes
- [ ] Single-use tokens (marked as used after verification)
- [ ] Rate limiting: max 5 magic link requests per email per hour
- [ ] Email template for magic link with clear call-to-action
- [ ] Works for existing users and creates account for new users

---

## Technical Notes

### Token Generation
```typescript
// src/lib/auth/magic-link.ts
export function generateMagicLinkToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getMagicLinkExpiry(): string {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry.toISOString();
}
```

### Rate Limiting with KV
```typescript
// src/lib/auth/rate-limit.ts
const MAGIC_LINK_LIMIT = 5;
const MAGIC_LINK_WINDOW = 60 * 60; // 1 hour in seconds

export async function checkMagicLinkRateLimit(kv: KVNamespace, email: string): Promise<boolean> {
  const key = `magic_link_rate:${email.toLowerCase()}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  return count < MAGIC_LINK_LIMIT;
}

export async function incrementMagicLinkRateLimit(kv: KVNamespace, email: string): Promise<void> {
  const key = `magic_link_rate:${email.toLowerCase()}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  await kv.put(key, String(count + 1), { expirationTtl: MAGIC_LINK_WINDOW });
}
```

### Request Magic Link Endpoint
```typescript
// src/pages/api/auth/magic-link.ts
import type { APIRoute } from 'astro';
import { createDb, UserRepository, MagicLinkRepository } from '@/db';
import { generateMagicLinkToken, getMagicLinkExpiry } from '@/lib/auth/magic-link';
import { checkMagicLinkRateLimit, incrementMagicLinkRateLimit } from '@/lib/auth/rate-limit';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = createDb(locals.runtime.env.DB);
  const kv = locals.runtime.env.KV;
  const { email } = await request.json();

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limit
  const allowed = await checkMagicLinkRateLimit(kv, normalizedEmail);
  if (!allowed) {
    return new Response(JSON.stringify({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' }
    }), { status: 429 });
  }

  // Find or create user
  let user = await UserRepository.findByEmail(db, normalizedEmail);
  if (!user) {
    user = await UserRepository.create(db, { email: normalizedEmail });
  }

  // Generate magic link
  const token = generateMagicLinkToken();
  const expiresAt = getMagicLinkExpiry();

  await MagicLinkRepository.create(db, {
    token,
    userId: user.id,
    expiresAt,
  });

  // Increment rate limit
  await incrementMagicLinkRateLimit(kv, normalizedEmail);

  // Queue email
  const magicLinkUrl = `${locals.runtime.env.APP_URL}/auth/verify?token=${token}`;
  await locals.runtime.env.EMAIL_QUEUE.send({
    type: 'magic_link',
    to: normalizedEmail,
    data: { magicLinkUrl, expiresInMinutes: 15 },
  });

  // Always return success (don't leak user existence)
  return new Response(JSON.stringify({ message: 'If an account exists, a magic link has been sent.' }), { status: 200 });
};
```

### Verify Magic Link Endpoint
```typescript
// src/pages/api/auth/verify-magic-link.ts
import type { APIRoute } from 'astro';
import { createDb, MagicLinkRepository, UserRepository, SessionRepository } from '@/db';
import { createSessionCookie } from '@/lib/auth/session';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = createDb(locals.runtime.env.DB);
  const { token } = await request.json();

  // Find magic link
  const magicLink = await MagicLinkRepository.findByToken(db, token);

  if (!magicLink) {
    return new Response(JSON.stringify({
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired link' }
    }), { status: 400 });
  }

  // Check expiry
  if (new Date(magicLink.expiresAt) < new Date()) {
    return new Response(JSON.stringify({
      error: { code: 'EXPIRED_TOKEN', message: 'This link has expired. Please request a new one.' }
    }), { status: 400 });
  }

  // Check if already used
  if (magicLink.usedAt) {
    return new Response(JSON.stringify({
      error: { code: 'USED_TOKEN', message: 'This link has already been used.' }
    }), { status: 400 });
  }

  // Mark as used
  await MagicLinkRepository.markUsed(db, magicLink.id);

  // Get user
  const user = await UserRepository.findById(db, magicLink.userId);
  if (!user) {
    return new Response(JSON.stringify({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    }), { status: 400 });
  }

  // Mark email as verified if not already
  if (!user.emailVerifiedAt) {
    await UserRepository.update(db, user.id, { emailVerifiedAt: new Date().toISOString() });
  }

  // Update last login
  await UserRepository.update(db, user.id, { lastLoginAt: new Date().toISOString() });

  // Create session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const session = await SessionRepository.create(db, {
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
  });

  return new Response(JSON.stringify({
    user: { id: user.id, email: user.email, name: user.name }
  }), {
    status: 200,
    headers: { 'Set-Cookie': createSessionCookie(session.id) },
  });
};
```

### Magic Link Verification Page
```typescript
// src/pages/auth/verify.astro
---
import Layout from '@/components/Layout.astro';

const { token } = Astro.url.searchParams;

if (!token) {
  return Astro.redirect('/auth/login?error=invalid_link');
}
---

<Layout title="Signing in...">
  <div id="verify-container">
    <p>Verifying your magic link...</p>
  </div>

  <script define:vars={{ token }}>
    async function verifyToken() {
      try {
        const response = await fetch('/api/auth/verify-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          window.location.href = '/app';
        } else {
          const data = await response.json();
          window.location.href = `/auth/login?error=${data.error.code}`;
        }
      } catch (error) {
        window.location.href = '/auth/login?error=unknown';
      }
    }

    verifyToken();
  </script>
</Layout>
```

### Magic Link Email Template
```typescript
// src/lib/email/templates/magic-link.tsx
import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface MagicLinkEmailProps {
  magicLinkUrl: string;
  expiresInMinutes: number;
}

export function MagicLinkEmail({ magicLinkUrl, expiresInMinutes }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f6f6' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>Sign in to downtime.online</Text>
          <Text>Click the button below to sign in. This link expires in {expiresInMinutes} minutes.</Text>
          <Button
            href={magicLinkUrl}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Sign In
          </Button>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#666666' }}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Testing

- [ ] Magic link token is 64 characters (32 bytes hex)
- [ ] Magic link expires after 15 minutes
- [ ] Magic link can only be used once
- [ ] Rate limiting prevents >5 requests per hour per email
- [ ] New user created if email doesn't exist
- [ ] Existing user receives link without creating duplicate
- [ ] Email verified flag set on first magic link use
- [ ] Session created after successful verification
- [ ] Invalid/expired tokens show appropriate error

---

## Files to Create/Modify

- `src/lib/auth/magic-link.ts`
- `src/lib/auth/rate-limit.ts`
- `src/db/repositories/magic-links.ts`
- `src/pages/api/auth/magic-link.ts`
- `src/pages/api/auth/verify-magic-link.ts`
- `src/pages/auth/verify.astro`
- `src/lib/email/templates/magic-link.tsx`
