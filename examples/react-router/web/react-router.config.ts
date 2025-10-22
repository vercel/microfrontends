import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  presets: process.env.VERCEL_ENV ? [vercelPreset()] : [],
  ssr: true,
} satisfies Config;
