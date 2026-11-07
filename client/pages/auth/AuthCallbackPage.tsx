import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth";

/**
 * Where Google (or an email confirmation link) sends the browser back to.
 *
 * There is almost nothing to do here: the Supabase client is set up with
 * `detectSessionInUrl`, so it reads the code out of the URL and finishes the
 * login by itself. We just wait for that to land, then move along.
 */
export default function AuthCallbackPage() {
  const { user, loading } = useAuth();

  if (loading) return <main>Logging in...</main>;

  return <Navigate to={user ? "/" : "/signin"} replace />;
}
