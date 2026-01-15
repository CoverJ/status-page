# DT-010: Page Settings Management

**Epic:** Admin Dashboard - Page Management
**Priority:** Medium
**Estimate:** Medium
**Dependencies:** DT-008, DT-009

---

## Description

Allow page owners and admins to configure page settings including name, description, custom domain, timezone, and custom status text.

---

## Acceptance Criteria

- [ ] Settings page accessible to owners and admins only
- [ ] Form fields: name, description, subdomain, timezone
- [ ] Custom domain field (display instructions for MVP)
- [ ] Custom "All Systems Operational" text override
- [ ] Subdomain change with availability check
- [ ] Save confirmation with success/error feedback
- [ ] Cancel reverts unsaved changes
- [ ] Timezone dropdown with common zones

---

## Technical Notes

### Settings Page
```astro
// src/pages/app/[pageId]/settings/index.astro
---
import { requireAdmin } from '@/lib/auth/guards';
import DashboardLayout from '@/components/dashboard/Layout.astro';
import { createDb, PageRepository } from '@/db';

const { pageId } = Astro.params;
const authResponse = await requireAdmin(Astro, pageId);
if (authResponse) return authResponse;

const db = createDb(Astro.locals.runtime.env.DB);
const page = await PageRepository.findById(db, pageId);

if (!page) {
  return Astro.redirect('/app?error=page_not_found');
}

const { user, membership } = Astro.locals;
---

<DashboardLayout pageId={pageId} pageName={page.name} user={user} role={membership.role} title="Settings">
  <div class="settings-container">
    <h1>Page Settings</h1>

    <form id="settings-form" class="settings-form">
      <section class="settings-section">
        <h2>General</h2>

        <div class="form-group">
          <label for="name">Page Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={page.name}
            required
            maxlength="100"
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            maxlength="500"
            placeholder="A brief description of your service..."
          >{page.description || ''}</textarea>
        </div>

        <div class="form-group">
          <label for="subdomain">Subdomain</label>
          <div class="subdomain-input-wrapper">
            <input
              type="text"
              id="subdomain"
              name="subdomain"
              value={page.subdomain}
              required
              pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
              minlength="3"
              maxlength="63"
            />
            <span class="subdomain-suffix">.downtime.online</span>
          </div>
          <p class="help-text" id="subdomain-status"></p>
        </div>

        <div class="form-group">
          <label for="timezone">Timezone</label>
          <select id="timezone" name="timezone">
            {TIMEZONES.map(tz => (
              <option value={tz.value} selected={page.timezone === tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p class="help-text">Used for displaying incident timestamps.</p>
        </div>
      </section>

      <section class="settings-section">
        <h2>Custom Domain</h2>

        <div class="form-group">
          <label for="customDomain">Custom Domain</label>
          <input
            type="text"
            id="customDomain"
            name="customDomain"
            value={page.customDomain || ''}
            placeholder="status.yourcompany.com"
          />
          <p class="help-text">
            To use a custom domain, add a CNAME record pointing to
            <code>{page.subdomain}.downtime.online</code>
          </p>
        </div>
      </section>

      <section class="settings-section">
        <h2>Status Messages</h2>

        <div class="form-group">
          <label for="operationalText">Operational Status Text</label>
          <input
            type="text"
            id="operationalText"
            name="operationalText"
            value={page.statusDescription || 'All Systems Operational'}
            placeholder="All Systems Operational"
            maxlength="100"
          />
          <p class="help-text">Displayed when all components are operational.</p>
        </div>
      </section>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary" id="save-btn">Save Changes</button>
      </div>
    </form>
  </div>

  <script define:vars={{ pageId, originalSubdomain: page.subdomain }}>
    import { initSettingsForm } from '@/scripts/settings';
    initSettingsForm(pageId, originalSubdomain);
  </script>
</DashboardLayout>
```

### Settings Form Script
```typescript
// src/scripts/settings.ts
export function initSettingsForm(pageId: string, originalSubdomain: string) {
  const form = document.getElementById('settings-form') as HTMLFormElement;
  const subdomainInput = document.getElementById('subdomain') as HTMLInputElement;
  const subdomainStatus = document.getElementById('subdomain-status') as HTMLParagraphElement;
  const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
  const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

  let isSubdomainValid = true;
  let checkTimeout: ReturnType<typeof setTimeout>;
  const originalValues = new FormData(form);

  // Subdomain validation
  subdomainInput.addEventListener('input', () => {
    const value = subdomainInput.value.toLowerCase().trim();
    subdomainInput.value = value;

    clearTimeout(checkTimeout);

    if (value === originalSubdomain) {
      subdomainStatus.textContent = '';
      isSubdomainValid = true;
      return;
    }

    // Validate and check availability
    checkTimeout = setTimeout(async () => {
      const response = await fetch(`/api/pages/check-subdomain?subdomain=${value}`);
      const { available } = await response.json();

      if (available) {
        subdomainStatus.textContent = 'Available!';
        subdomainStatus.className = 'help-text success';
        isSubdomainValid = true;
      } else {
        subdomainStatus.textContent = 'This subdomain is already taken.';
        subdomainStatus.className = 'help-text error';
        isSubdomainValid = false;
      }
    }, 500);
  });

  // Cancel button
  cancelBtn.addEventListener('click', () => {
    // Restore original values
    for (const [key, value] of originalValues.entries()) {
      const input = form.elements.namedItem(key) as HTMLInputElement;
      if (input) input.value = value as string;
    }
    subdomainStatus.textContent = '';
    isSubdomainValid = true;
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isSubdomainValid) {
      subdomainInput.focus();
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const formData = new FormData(form);
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (response.ok) {
        showToast('Settings saved successfully', 'success');
        // Update original values
        originalValues.forEach((_, key) => {
          originalValues.set(key, formData.get(key) as string);
        });
      } else {
        const { error } = await response.json();
        showToast(error.message || 'Failed to save settings', 'error');
      }
    } catch (error) {
      showToast('An error occurred', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });
}

function showToast(message: string, type: 'success' | 'error') {
  // Implementation depends on toast library or custom component
  console.log(`[${type}] ${message}`);
}
```

### Update Page API
```typescript
// src/pages/api/pages/[pageId]/index.ts
import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/auth/guards';
import { createDb, PageRepository } from '@/db';

export const PATCH: APIRoute = async (context) => {
  const { pageId } = context.params;
  const authResponse = await requireAdmin(context, pageId);
  if (authResponse) return authResponse;

  const db = createDb(context.locals.runtime.env.DB);
  const updates = await context.request.json();

  // Validate subdomain if changed
  if (updates.subdomain) {
    const exists = await PageRepository.subdomainExists(db, updates.subdomain, pageId);
    if (exists) {
      return new Response(JSON.stringify({
        error: { code: 'SUBDOMAIN_TAKEN', message: 'This subdomain is already taken' }
      }), { status: 400 });
    }
  }

  // Update page
  const page = await PageRepository.update(db, pageId, {
    name: updates.name,
    description: updates.description,
    subdomain: updates.subdomain,
    customDomain: updates.customDomain || null,
    timezone: updates.timezone,
    statusDescription: updates.operationalText,
  });

  if (!page) {
    return new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Page not found' }
    }), { status: 404 });
  }

  return new Response(JSON.stringify({ page }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Timezone Data
```typescript
// src/lib/constants/timezones.ts
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Amsterdam' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];
```

---

## Testing

- [ ] Only owners and admins can access settings
- [ ] Members receive 403 when accessing settings
- [ ] Name updates saved correctly
- [ ] Subdomain change works with availability check
- [ ] Duplicate subdomain rejected
- [ ] Timezone saved and used for timestamps
- [ ] Custom domain field saves correctly
- [ ] Cancel button restores original values
- [ ] Success toast shown on save
- [ ] Error toast shown on failure

---

## Files to Create/Modify

- `src/pages/app/[pageId]/settings/index.astro`
- `src/scripts/settings.ts`
- `src/pages/api/pages/[pageId]/index.ts`
- `src/lib/constants/timezones.ts`
- `src/styles/settings.css`
