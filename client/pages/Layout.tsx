import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { Spinner } from "../components";
import { useAuth } from "../lib/auth";
import {
  APP_NAME,
  COURSE_CREDITS,
  COURSE_GITHUB,
  SHOW_DEMOS,
} from "../lib/config";
import styles from "./Layout.module.css";

/**
 * The frame around every page: the bar at the top, the footer at the
 * bottom, and the current page in between. Change the links and the footer
 * freely - this is your app's, not part of the design system.
 *
 * Applied in client/App.tsx. Pages nested inside
 * <Route element={<Layout />}> get this header and footer, drawn where
 * <Outlet /> is. Pages that fill the whole screen on their own (like sign
 * in) are simply not nested inside it.
 *
 * React Router calls this a "layout route":
 * https://reactrouter.com/start/declarative/routing#layout-routes
 */
export function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.appName}>
          {APP_NAME}
        </Link>
        <nav className={styles.nav}>
          <Link to="/">Home</Link>
          <a href={COURSE_GITHUB} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {SHOW_DEMOS ? <Link to="/demos">Demos</Link> : null}
        </nav>
      </header>

      <div className={styles.content}>
        {/* Shows a spinner while the page downloads, under the header. */}
        <Suspense
          fallback={
            <main>
              <Spinner />
            </main>
          }
        >
          <Outlet />
        </Suspense>
      </div>

      <footer className={styles.footer}>
        <p>This is some example footer content.</p>
        <p>
          <AuthAction /> | {COURSE_CREDITS}
        </p>
      </footer>
    </div>
  );
}

/** "hey, you" and a way out - or a way in, if nobody is logged in. */
function AuthAction() {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Link to="/signin">Log In</Link>;

  return (
    <>
      hey {user.email} :){" "}
      <button
        type="button"
        className={styles.linkButton}
        onClick={() => void signOut()}
      >
        Log Out
      </button>
    </>
  );
}
