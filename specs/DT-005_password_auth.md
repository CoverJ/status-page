# DT-005: Password Authentication

**Epic:** Authentication System
**Priority:** Critical
**Estimate:** Medium
**Dependencies:** DT-003, DT-004

---

## Description

Implement secure password-based authentication including password hashing, verification, signup, login, and session management.

---

## Acceptance Criteria

- [ ] Password hashing utility using PBKDF2 (100k iterations, SHA-256)
- [ ] Password verification utility
- [ ] Password strength validation (min 8 chars, requires letter and number)
- [ ] Signup endpoint creates user with hashed password
- [ ] Login endpoint verifies password and creates session
- [ ] Session stored in HTTP-only secure cookie
- [ ] Logout endpoint destroys session
- [ ] Error messages don't leak user existence information

---

## Technical Notes

### Password Hashing (Web Crypto API)
```typescript
// src/lib/auth/password.ts
const ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    passwordKey,
    KEY_LENGTH
  );

  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: HASH_ALGORITHM,
      },
      passwordKey,
      KEY_LENGTH
    );

    const hashArray = new Uint8Array(hash);
    return timingSafeEqual(hashArray, storedHashBytes);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
```

### Password Validation
```typescript
// src/lib/auth/validation.ts
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return { valid: errors.length === 0, errors };
}
```

### Session Management
```typescript
// src/lib/auth/session.ts
const SESSION_COOKIE_NAME = 'dt_session';
const SESSION_DURATION_DAYS = 30;

export function createSessionCookie(sessionId: string): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);

  return `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;
  return sessionCookie.split('=')[1] || null;
}
```

### Signup Endpoint
```typescript
// src/pages/api/auth/signup.ts
import type { APIRoute } from 'astro';
import { createDb, UserRepository, SessionRepository } from '@/db';
import { hashPassword, validatePassword, createSessionCookie } from '@/lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = createDb(locals.runtime.env.DB);
  const { email, password, name } = await request.json();

  // Validate input
  const validation = validatePassword(password);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: { code: 'INVALID_PASSWORD', message: validation.errors[0] } }), { status: 400 });
  }

  // Check if user exists
  const existingUser = await UserRepository.findByEmail(db, email);
  if (existingUser) {
    // Generic error to prevent email enumeration
    return new Response(JSON.stringify({ error: { code: 'SIGNUP_FAILED', message: 'Unable to create account' } }), { status: 400 });
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const user = await UserRepository.create(db, { email, passwordHash, name });

  // Create session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const session = await SessionRepository.create(db, {
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
  });

  return new Response(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name } }), {
    status: 201,
    headers: { 'Set-Cookie': createSessionCookie(session.id) },
  });
};
```

### Login Endpoint
```typescript
// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { createDb, UserRepository, SessionRepository } from '@/db';
import { verifyPassword, createSessionCookie } from '@/lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = createDb(locals.runtime.env.DB);
  const { email, password } = await request.json();

  const user = await UserRepository.findByEmail(db, email);
  if (!user || !user.passwordHash) {
    return new Response(JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }), { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return new Response(JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }), { status: 401 });
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

  return new Response(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name } }), {
    status: 200,
    headers: { 'Set-Cookie': createSessionCookie(session.id) },
  });
};
```

---

## Testing

- [ ] Password hashing produces different output for same input (salt)
- [ ] Password verification succeeds for correct password
- [ ] Password verification fails for incorrect password
- [ ] Timing-safe comparison used (no timing attacks)
- [ ] Signup creates user and session
- [ ] Signup fails for duplicate email (generic error)
- [ ] Login succeeds with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login fails for non-existent user (same error)
- [ ] Session cookie set correctly (HttpOnly, Secure, SameSite)
- [ ] Logout clears session

---

## Files to Create/Modify

- `src/lib/auth/password.ts`
- `src/lib/auth/validation.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/index.ts`
- `src/pages/api/auth/signup.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/logout.ts`
