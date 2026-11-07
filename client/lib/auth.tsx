// This file deliberately keeps the whole login story in one place: the
// provider, the hook that reads it, and the route guard. That trips a rule
// about hot-reloading, whose only cost is that editing THIS file reloads the
// page instead of patching it. Worth it for having one file to read.
/* eslint-disable react-refresh/only-export-components */
import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { SUPABASE_ENABLED } from "./config";
import { supabase } from "./supabase";

type AuthState = {
  /** The logged-in user, or null if nobody is logged in. */
  user: { id: string; email: string } | null;
  /** True while we are still checking. Show a spinner, not a login form. */
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  /**
   * Creates an account. Returns true when Supabase wants the address
   * confirmed by email before the person can log in - in which case no
   * session exists yet and the caller should say so.
   */
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function toUser(session: Session | null) {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? "" };
}

/**
 * Keeps track of who is logged in, for the whole app.
 * It is wrapped around everything in client/App.tsx.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  // If Supabase isn't configured yet there is nothing to check, so we are
  // never "loading". Working that out here rather than inside the effect
  // keeps the first render honest.
  const [loading, setLoading] = useState(SUPABASE_ENABLED);

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;

    // Who is logged in right now?
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      setLoading(false);
    });

    // ...and tell us whenever that changes (login, logout, token refresh).
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(toUser(session));
        setLoading(false);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,

      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(error.message);
      },

      async signUpWithPassword(email, password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw new Error(error.message);
        // No session means Supabase sent a confirmation email instead of
        // logging them straight in. Without telling them, pressing the
        // button appears to do nothing at all.
        return data.session === null;
      },

      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          // Where Google sends the browser back to. This exact URL must also
          // be listed in Supabase -> Authentication -> URL Configuration.
          // See docs/03-google-sign-in.md.
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw new Error(error.message);
      },

      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
      },
    }),
    [user, loading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

/** Read the logged-in user from anywhere: `const { user } = useAuth();` */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

/**
 * Put routes inside this to require a login for all of them:
 *
 *     <Route element={<RequireAuth />}>
 *       <Route path="/events" element={<EventsPage />} />
 *     </Route>
 */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <main>Loading...</main>;

  if (!user) {
    // Remember where they were heading, so we can send them back after login.
    return (
      <Navigate to="/signin" state={{ from: location.pathname }} replace />
    );
  }

  return <Outlet />;
}
