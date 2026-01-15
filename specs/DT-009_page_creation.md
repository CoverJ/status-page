# DT-009: Page Creation Flow

**Epic:** Admin Dashboard - Page Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-004, DT-008

---

## Description

Allow authenticated users to create new status pages with validated subdomains.

---

## Acceptance Criteria

- [ ] "Create Page" form with name and subdomain fields
- [ ] Subdomain validation: alphanumeric and hyphens only, 3-63 characters
- [ ] Subdomain cannot start or end with hyphen
- [ ] Real-time subdomain availability check
- [ ] Reserved subdomains blocked (www, app, api, admin, etc.)
- [ ] Page created with user as owner
- [ ] Redirect to new page dashboard after creation
- [ ] Error handling for duplicate subdomains

---

## Technical Notes

### Page Creation Page
```astro
// src/pages/app/new.astro
---
import { requireAuth } from '@/lib/auth/guards';
import BaseLayout from '@/components/BaseLayout.astro';

const authResponse = requireAuth(Astro);
if (authResponse) return authResponse;

const { user } = Astro.locals;
---

<BaseLayout title="Create Status Page">
  <div class="create-page-container">
    <h1>Create a new status page</h1>
    <p class="subtitle">Set up a status page for your service or product.</p>

    <form id="create-page-form" class="create-page-form">
      <div class="form-group">
        <label for="name">Page Name</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="My Service"
          required
          maxlength="100"
        />
        <p class="help-text">This will be displayed as the title of your status page.</p>
      </div>

      <div class="form-group">
        <label for="subdomain">Subdomain</label>
        <div class="subdomain-input-wrapper">
          <input
            type="text"
            id="subdomain"
            name="subdomain"
            placeholder="my-service"
            required
            pattern="^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
            minlength="3"
            maxlength="63"
          />
          <span class="subdomain-suffix">.downtime.online</span>
        </div>
        <p class="help-text" id="subdomain-status"></p>
      </div>

      <button type="submit" class="btn btn-primary" id="submit-btn">
        Create Status Page
      </button>
    </form>
  </div>

  <script>
    import { createPageForm } from '@/scripts/create-page';
    createPageForm();
  </script>
</BaseLayout>
```

### Form Handling Script
```typescript
// src/scripts/create-page.ts
export function createPageForm() {
  const form = document.getElementById('create-page-form') as HTMLFormElement;
  const subdomainInput = document.getElementById('subdomain') as HTMLInputElement;
  const subdomainStatus = document.getElementById('subdomain-status') as HTMLParagraphElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  let checkTimeout: ReturnType<typeof setTimeout>;
  let isSubdomainValid = false;

  // Subdomain validation and availability check
  subdomainInput.addEventListener('input', () => {
    const value = subdomainInput.value.toLowerCase().trim();
    subdomainInput.value = value;

    clearTimeout(checkTimeout);

    // Client-side validation
    const validationResult = validateSubdomain(value);
    if (!validationResult.valid) {
      subdomainStatus.textContent = validationResult.error;
      subdomainStatus.className = 'help-text error';
      isSubdomainValid = false;
      return;
    }

    // Check availability after debounce
    subdomainStatus.textContent = 'Checking availability...';
    subdomainStatus.className = 'help-text checking';

    checkTimeout = setTimeout(async () => {
      const available = await checkSubdomainAvailability(value);
      if (available) {
        subdomainStatus.textContent = `${value}.downtime.online is available!`;
        subdomainStatus.className = 'help-text success';
        isSubdomainValid = true;
      } else {
        subdomainStatus.textContent = 'This subdomain is already taken.';
        subdomainStatus.className = 'help-text error';
        isSubdomainValid = false;
      }
    }, 500);
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isSubdomainValid) {
      subdomainInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
      const formData = new FormData(form);
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          subdomain: formData.get('subdomain'),
        }),
      });

      if (response.ok) {
        const { page } = await response.json();
        window.location.href = `/app/${page.id}`;
      } else {
        const { error } = await response.json();
        alert(error.message || 'Failed to create page');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Status Page';
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Status Page';
    }
  });
}

function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (subdomain.length < 3) {
    return { valid: false, error: 'Subdomain must be at least 3 characters.' };
  }
  if (subdomain.length > 63) {
    return { valid: false, error: 'Subdomain must be 63 characters or less.' };
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) {
    return { valid: false, error: 'Subdomain can only contain lowercase letters, numbers, and hyphens.' };
  }
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { valid: false, error: 'Subdomain cannot start or end with a hyphen.' };
  }
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return { valid: false, error: 'This subdomain is reserved.' };
  }
  return { valid: true };
}

async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  const response = await fetch(`/api/pages/check-subdomain?subdomain=${subdomain}`);
  const { available } = await response.json();
  return available;
}

const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'status', 'mail', 'smtp', 'ftp',
  'blog', 'help', 'support', 'docs', 'cdn', 'assets', 'static',
  'login', 'signup', 'register', 'account', 'billing', 'dashboard',
];
```

### API Endpoints
```typescript
// src/pages/api/pages/index.ts
import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/auth/guards';
import { createDb, PageRepository, TeamMemberRepository } from '@/db';

const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'status', 'mail', 'smtp', 'ftp',
  'blog', 'help', 'support', 'docs', 'cdn', 'assets', 'static',
  'login', 'signup', 'register', 'account', 'billing', 'dashboard',
];

export const GET: APIRoute = async (context) => {
  const authResponse = requireAuth(context);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const pages = await TeamMemberRepository.findPagesByUser(db, context.locals.user!.id);

  return new Response(JSON.stringify({ pages }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async (context) => {
  const authResponse = requireAuth(context);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const { name, subdomain } = await context.request.json();

  // Validate subdomain format
  if (!isValidSubdomain(subdomain)) {
    return new Response(JSON.stringify({
      error: { code: 'INVALID_SUBDOMAIN', message: 'Invalid subdomain format' }
    }), { status: 400 });
  }

  // Check reserved
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return new Response(JSON.stringify({
      error: { code: 'RESERVED_SUBDOMAIN', message: 'This subdomain is reserved' }
    }), { status: 400 });
  }

  // Check availability
  const exists = await PageRepository.subdomainExists(db, subdomain);
  if (exists) {
    return new Response(JSON.stringify({
      error: { code: 'SUBDOMAIN_TAKEN', message: 'This subdomain is already taken' }
    }), { status: 400 });
  }

  // Create page
  const page = await PageRepository.create(db, { name, subdomain });

  // Add user as owner
  await TeamMemberRepository.create(db, {
    pageId: page.id,
    userId: context.locals.user!.id,
    role: 'owner',
  });

  return new Response(JSON.stringify({ page }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

function isValidSubdomain(subdomain: string): boolean {
  if (typeof subdomain !== 'string') return false;
  if (subdomain.length < 3 || subdomain.length > 63) return false;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) return false;
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) return false;
  return true;
}
```

```typescript
// src/pages/api/pages/check-subdomain.ts
import type { APIRoute } from 'astro';
import { createDb, PageRepository } from '@/db';

const RESERVED_SUBDOMAINS = [
  'www', 'app', 'api', 'admin', 'status', 'mail', 'smtp', 'ftp',
  'blog', 'help', 'support', 'docs', 'cdn', 'assets', 'static',
  'login', 'signup', 'register', 'account', 'billing', 'dashboard',
];

export const GET: APIRoute = async (context) => {
  const subdomain = context.url.searchParams.get('subdomain')?.toLowerCase();

  if (!subdomain) {
    return new Response(JSON.stringify({ available: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check reserved
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return new Response(JSON.stringify({ available: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check database
  const db = createDb(context.locals.runtime.env.DB);
  const exists = await PageRepository.subdomainExists(db, subdomain);

  return new Response(JSON.stringify({ available: !exists }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

---

## Testing

- [ ] Valid subdomain accepted (letters, numbers, hyphens)
- [ ] Invalid subdomain rejected (special chars, too short/long)
- [ ] Subdomain starting/ending with hyphen rejected
- [ ] Reserved subdomains rejected
- [ ] Duplicate subdomain rejected
- [ ] Real-time availability check works
- [ ] Page created successfully with valid input
- [ ] User added as owner of created page
- [ ] Redirect to new page dashboard works

---

## Files to Create/Modify

- `src/pages/app/new.astro`
- `src/scripts/create-page.ts`
- `src/pages/api/pages/index.ts`
- `src/pages/api/pages/check-subdomain.ts`
- `src/db/repositories/team-members.ts` (add findPagesByUser)
