import { defineConfig, type Plugin } from 'vite';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
import { vercelToolbar } from '@vercel/toolbar/plugins/vite';
import react from '@vitejs/plugin-react';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [
    tailwindcss(),
    microfrontends() as Plugin,
    vercelToolbar(),
    react(),
    federation({
      name: 'root',
      manifest: true,
      remotes: {
        web: {
          type: 'module',
          name: 'web',
          entry: '/_web/remoteEntry.js',
        },
        shared: {
          type: 'module',
          name: 'shared',
          entry: '/_shared/remoteEntry.js',
        },
      },
      shared: {
        react: {
          singleton: true,
        },
        'react/': {
          singleton: true,
        },
        'react-dom': {
          singleton: true,
        },
        'react-dom/': {
          singleton: true,
        },
      },
    }) as Plugin[],
  ],
  build: {
    target: 'chrome89',
  },
});
