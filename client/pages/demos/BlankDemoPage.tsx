import styles from "./BlankDemoPage.module.css";

/**
 * A blank slate: one page, one CSS file. Copy both to start a new page,
 * then add a <Route> for it in client/App.tsx.
 */
export default function BlankDemoPage() {
  return (
    <main>
      <h1 className={styles.hey}>Hey</h1>
    </main>
  );
}
