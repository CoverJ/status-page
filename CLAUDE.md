## Misc

* Study `/specs/*` to learn about requirements.

## Common Development Tasks

* Test using the following commands;
    * `pnpm test` runs the unit test suite with vitest.
    * `pnpm test:e2e` and `pnpm test:e2e:ui` run the E2E tests.
    * `pnpm test:all` is a shortcut for running both `pnpm test` and `pnpm test:e2e`
* Lint the code with `pnpm run lint:fix`
* build the code with `pnpm build`
* generate cloudflare types with `pnpm run cd-typegen`

## Wrap it up

* If you are instructed to wrap a piece of work up you should take that as instruction to;
  1. Perform a `pnpm run lint:fix`
  2. Perform a `pnpm run test:all`
  3. Perform `pnpm build`
  4. Perform `pnpm run deploy`
  5. Create a git commit with a descriptive message. Have commit messages focus on the 'why' and 'what' with minimal 'how'
  <example>
    Fix race condition in user session handling

    The previous implementation allowed concurrent requests to 
    create duplicate sessions when login requests arrived 
    simultaneously. Added mutex lock around session creation.
  </example>
  6. Perform a git push.
  7. Update your ticket to the completed status in the /specs/ToC.md file.

  A work item is not considered finish until each of the above is completed successfully. If any of steps 1-4 fails, stop the wrap up process, address the issue, then start the process from the beginning.

## Tech Stack

The project is using the Astro framework. It is deployed onto Cloudflare infrastucture.

### UI
* Shadcn for UI components.
* tailwind for css

### Backend
* Drizzle ORM backed by Cloudflare D1
* SSR driven by Cloudflare workers

