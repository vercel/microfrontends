import styles from '../page.module.css';
import { ClientButton } from './client-button';

export default function ServerActionsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Server Actions</h1>
        <ClientButton />
      </main>
    </div>
  );
}
