import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
import { vercelToolbar } from '@vercel/toolbar/plugins/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    microfrontends(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    vercelToolbar(),
  ],
});
