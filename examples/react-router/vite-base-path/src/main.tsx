import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './AppRouter';
import { mountVercelToolbar } from '@vercel/toolbar/vite';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);

mountVercelToolbar();
