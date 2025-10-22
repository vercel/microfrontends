import { mountVercelToolbar } from '@vercel/toolbar/vite';
import { registerApplication, start } from 'single-spa';
import './globals.css';

registerApplication(
  'header',
  () => import('shared/header'),
  () => true,
);

registerApplication(
  'footer',
  () => import('shared/footer'),
  () => true,
);

registerApplication(
  'web',
  () => import('web/page'),
  () => true,
);

start();
mountVercelToolbar();
