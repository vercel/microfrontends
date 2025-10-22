import { sveltekit } from '@sveltejs/kit/vite';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
import { defineConfig } from 'vite';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [microfrontends(), sveltekit()],
});
