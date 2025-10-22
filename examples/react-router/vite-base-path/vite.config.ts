import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
import { vercelToolbar } from '@vercel/toolbar/plugins/vite';

export default defineConfig({
  plugins: [
    react(),
    microfrontends({
      basePath: '/vite-base-path',
    }),
    vercelToolbar(),
  ],
});
