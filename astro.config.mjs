import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tractstack from 'astro-tractstack';

export default defineConfig({
  integrations: [
    react(),
    tractstack({
      includeExamples: false,
      enableMultiTenant: false,
    }),
  ],
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
});
