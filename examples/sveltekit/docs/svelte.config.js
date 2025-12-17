import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { withMicrofrontends } from '@vercel/microfrontends/experimental/sveltekit';

/** @type {import('@sveltejs/kit').Config} */
const config = withMicrofrontends({
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
  },
});

export default config;
