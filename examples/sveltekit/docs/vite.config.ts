import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';

export default defineConfig({
  plugins: [microfrontends(), sveltekit()],
});
