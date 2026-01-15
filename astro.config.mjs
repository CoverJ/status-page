// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },

    imageService: "cloudflare"
  }),
  vite: {
    server: {
      watch: {
        usePolling: true
      }
    },

    // @ts-expect-error
    plugins: [tailwindcss()]
  }
});