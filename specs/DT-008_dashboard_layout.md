# DT-008: Dashboard Layout & Navigation

**Epic:** Admin Dashboard - Page Management
**Priority:** High
**Estimate:** Medium
**Dependencies:** DT-007

---

## Description

Create the admin dashboard shell with sidebar navigation, page selector, and responsive design.

---

## Acceptance Criteria

- [ ] Dashboard layout component with sidebar navigation
- [ ] Navigation items: Overview, Components, Incidents, Maintenance, Subscribers, Settings
- [ ] Page selector dropdown for users with multiple pages
- [ ] User menu with logout option
- [ ] Responsive design (sidebar collapses to hamburger on mobile)
- [ ] Loading states for page transitions
- [ ] Active navigation state highlighting
- [ ] Breadcrumb navigation

---

## Technical Notes

### Dashboard Layout Component
```astro
// src/components/dashboard/Layout.astro
---
import Sidebar from './Sidebar.astro';
import Header from './Header.astro';
import type { User, TeamMember } from '@/db/schema';

interface Props {
  pageId: string;
  pageName: string;
  user: User;
  role: TeamMember['role'];
  title?: string;
}

const { pageId, pageName, user, role, title } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title ? `${title} - ${pageName}` : pageName} | downtime.online</title>
    <link rel="stylesheet" href="/styles/dashboard.css" />
  </head>
  <body>
    <div class="dashboard-container">
      <Sidebar pageId={pageId} pageName={pageName} role={role} />
      <div class="dashboard-main">
        <Header user={user} pageName={pageName} />
        <main class="dashboard-content">
          <slot />
        </main>
      </div>
    </div>
    <script src="/scripts/dashboard.js"></script>
  </body>
</html>
```

### Sidebar Component
```astro
// src/components/dashboard/Sidebar.astro
---
interface Props {
  pageId: string;
  pageName: string;
  role: 'owner' | 'admin' | 'member';
}

const { pageId, pageName, role } = Astro.props;
const currentPath = Astro.url.pathname;

const navItems = [
  { href: `/app/${pageId}`, label: 'Overview', icon: 'home' },
  { href: `/app/${pageId}/components`, label: 'Components', icon: 'layers' },
  { href: `/app/${pageId}/incidents`, label: 'Incidents', icon: 'alert-circle' },
  { href: `/app/${pageId}/maintenance`, label: 'Maintenance', icon: 'calendar' },
  { href: `/app/${pageId}/subscribers`, label: 'Subscribers', icon: 'users' },
];

const settingsItems = [
  { href: `/app/${pageId}/settings`, label: 'Settings', icon: 'settings', roles: ['owner', 'admin'] },
  { href: `/app/${pageId}/team`, label: 'Team', icon: 'user-plus', roles: ['owner'] },
  { href: `/app/${pageId}/api-keys`, label: 'API Keys', icon: 'key', roles: ['owner', 'admin'] },
];

function isActive(href: string) {
  if (href === `/app/${pageId}`) {
    return currentPath === href;
  }
  return currentPath.startsWith(href);
}
---

<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <a href="/app" class="sidebar-logo">
      <span class="logo-text">downtime.online</span>
    </a>
    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
      <span class="icon-menu"></span>
    </button>
  </div>

  <div class="sidebar-page-selector">
    <button class="page-selector-btn" id="page-selector">
      <span class="page-name">{pageName}</span>
      <span class="icon-chevron-down"></span>
    </button>
  </div>

  <nav class="sidebar-nav">
    <ul class="nav-list">
      {navItems.map(item => (
        <li>
          <a
            href={item.href}
            class={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            <span class={`icon-${item.icon}`}></span>
            <span class="nav-label">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>

    <div class="nav-divider"></div>

    <ul class="nav-list">
      {settingsItems
        .filter(item => item.roles.includes(role))
        .map(item => (
          <li>
            <a
              href={item.href}
              class={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span class={`icon-${item.icon}`}></span>
              <span class="nav-label">{item.label}</span>
            </a>
          </li>
        ))}
    </ul>
  </nav>

  <div class="sidebar-footer">
    <a href={`https://${pageId}.downtime.online`} target="_blank" class="view-page-link">
      View Status Page
      <span class="icon-external-link"></span>
    </a>
  </div>
</aside>
```

### Header Component
```astro
// src/components/dashboard/Header.astro
---
interface Props {
  user: { email: string; name?: string };
  pageName: string;
}

const { user, pageName } = Astro.props;
const displayName = user.name || user.email.split('@')[0];
---

<header class="dashboard-header">
  <div class="header-left">
    <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu">
      <span class="icon-menu"></span>
    </button>
    <h1 class="header-title">{pageName}</h1>
  </div>

  <div class="header-right">
    <div class="user-menu" id="user-menu">
      <button class="user-menu-btn">
        <span class="user-avatar">{displayName.charAt(0).toUpperCase()}</span>
        <span class="user-name">{displayName}</span>
        <span class="icon-chevron-down"></span>
      </button>
      <div class="user-menu-dropdown">
        <a href="/app/account" class="dropdown-item">Account Settings</a>
        <div class="dropdown-divider"></div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" class="dropdown-item logout-btn">Log Out</button>
        </form>
      </div>
    </div>
  </div>
</header>
```

### Page Selector Dropdown (React)
```tsx
// src/components/dashboard/PageSelector.tsx
import { useState, useEffect } from 'react';

interface Page {
  id: string;
  name: string;
  subdomain: string;
}

interface Props {
  currentPageId: string;
  currentPageName: string;
}

export function PageSelector({ currentPageId, currentPageName }: Props) {
  const [pages, setPages] = useState<Page[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPages() {
      const response = await fetch('/api/pages');
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages);
      }
      setIsLoading(false);
    }
    loadPages();
  }, []);

  return (
    <div className="page-selector">
      <button
        className="page-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="page-name">{currentPageName}</span>
        <span className="icon-chevron-down" />
      </button>

      {isOpen && (
        <div className="page-selector-dropdown">
          {isLoading ? (
            <div className="dropdown-loading">Loading...</div>
          ) : (
            <>
              {pages.map(page => (
                <a
                  key={page.id}
                  href={`/app/${page.id}`}
                  className={`dropdown-item ${page.id === currentPageId ? 'active' : ''}`}
                >
                  {page.name}
                </a>
              ))}
              <div className="dropdown-divider" />
              <a href="/app/new" className="dropdown-item create-page">
                <span className="icon-plus" />
                Create New Page
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### CSS Structure
```css
/* src/styles/dashboard.css */
.dashboard-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: #1a1a1a;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.dashboard-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  height: 64px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 50;
}

.dashboard-content {
  flex: 1;
  padding: 24px;
  background: #f9fafb;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .dashboard-main {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }
}
```

---

## Testing

- [ ] Sidebar displays all navigation items
- [ ] Active navigation item highlighted
- [ ] Page selector shows all user's pages
- [ ] Page selector allows switching pages
- [ ] User menu opens/closes on click
- [ ] Logout button works
- [ ] Responsive: sidebar hidden on mobile
- [ ] Mobile menu button toggles sidebar
- [ ] Settings items hidden based on role

---

## Files to Create/Modify

- `src/components/dashboard/Layout.astro`
- `src/components/dashboard/Sidebar.astro`
- `src/components/dashboard/Header.astro`
- `src/components/dashboard/PageSelector.tsx`
- `src/styles/dashboard.css`
- `public/scripts/dashboard.js`
