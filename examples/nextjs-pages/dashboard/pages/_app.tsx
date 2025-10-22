import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { VercelToolbar } from '@vercel/toolbar/next';

 
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />;
      <VercelToolbar />
    </>
  );
}
