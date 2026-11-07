import styles from "./DesignPage.module.css";

/**
 * A page for a design you build from Figma. It is outside <RequireAuth> in
 * client/App.tsx, so it works without logging in - and without a .env file,
 * which is how a designer can run it on their own computer.
 */
export default function DesignPage() {
  return (
    <main>
      <h1 className={styles.title}>Design</h1>
      <p>This page is client/pages/design/DesignPage.tsx.</p>
    </main>
  );
}
