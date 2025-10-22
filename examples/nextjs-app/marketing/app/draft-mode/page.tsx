import { draftMode } from 'next/headers';
import styles from '../page.module.css';

export default async function DraftModePage() {
  const { isEnabled } = await draftMode();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Draft Mode</h1>
        <div>Enabled: {isEnabled ? 'true' : 'false'}</div>
      </main>
    </div>
  );
}
