import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { mountVercelToolbar } from '@vercel/toolbar/vite';
import AppRouter from './AppRouter';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);

mountVercelToolbar();
