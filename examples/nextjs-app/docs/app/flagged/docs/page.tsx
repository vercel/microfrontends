'use client';
import { useState } from 'react';
import styles from '../../docs/page.module.css';
import { runServerAction } from '../../docs/server-actions/actions';

export default function FlaggedDocsPage() {
  const [serverResponse, setServerResponse] = useState<string | null>(null);
  async function onClick() {
    setServerResponse(await runServerAction());
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Flagged Path</h1>
        <div>
          This page is served only when the flagged-docs-enabled flag is
          enabled.
        </div>
        <br />
        <span>Server action on flagged path</span>
        <button onClick={(): void => void onClick()} type="button">
          Run Server Action
        </button>
        <div>
          {serverResponse
            ? serverResponse
            : 'This content should be replaced with server response after click.'}
        </div>
      </main>
    </div>
  );
}
