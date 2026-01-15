# Testing Guide

This project uses two testing frameworks following the [Astro testing documentation](https://docs.astro.build/en/guides/testing/):

- **Vitest** - Unit and integration tests (with Astro Container API)
- **Playwright** - End-to-end tests

## Quick Start

```bash
# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run all tests
pnpm test:all
```

## Unit Tests (Vitest)

Unit tests use Vitest with Astro's Container API to test components in isolation.

### Location
- `tests/unit/` - Unit test files
- `src/**/*.test.ts` - Co-located component tests

### Example
```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import MyComponent from '../src/components/MyComponent.astro';

test('renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(MyComponent, {
    props: { title: 'Hello' },
  });

  expect(result).toContain('Hello');
});
```

## E2E Tests (Playwright)

End-to-end tests use Playwright to test the full application in a real browser.

### Location
- `tests/e2e/` - E2E test files

### Prerequisites

Playwright requires system dependencies for browser automation. Install them with:

```bash
# Install Playwright browsers
pnpm exec playwright install chromium

# Install system dependencies (requires sudo)
pnpm exec playwright install-deps chromium
```

**Note for WSL users:** You may need to manually install dependencies:
```bash
sudo apt-get update
sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```

### Example
```typescript
import { expect, test } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/');
});
```

## Configuration Files

- `vitest.config.ts` - Vitest configuration using Astro's `getViteConfig()`
- `playwright.config.ts` - Playwright configuration with dev server setup

## CI/CD

Both test suites are configured to work in CI environments:
- Vitest runs without additional setup
- Playwright automatically starts the dev server before tests

For CI, set `CI=true` environment variable to enable:
- Stricter test isolation
- Retries for flaky tests
- Single worker for Playwright
