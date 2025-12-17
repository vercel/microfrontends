import { sveltekit } from '@sveltejs/kit/vite';
import { microfrontends } from '@vercel/microfrontends/experimental/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [microfrontends(), sveltekit()],
});
