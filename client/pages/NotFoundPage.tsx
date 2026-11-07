import { Link } from "react-router";

/** Shown for any URL that doesn't match a route in client/App.tsx. */
export default function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The address you were looking for does not exist.</p>
      <Link to="/">Back to the home page</Link>
    </main>
  );
}
