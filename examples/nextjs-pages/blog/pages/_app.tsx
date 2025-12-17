import '@/styles/globals.css';
import { VercelToolbar } from '@vercel/toolbar/next';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <VercelToolbar />
    </>
  );
}
