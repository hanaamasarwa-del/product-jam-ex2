import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router";
import { Button, Card, Field, Input, Separator } from "../../components";
import { useAuth } from "../../lib/auth";
import { SUPABASE_ENABLED } from "../../lib/config";
import styles from "./SignInPage.module.css";

/** The login screen. Two ways in: Google, or an email and password. */
export default function SignInPage() {
  const { user, signInWithPassword, signUpWithPassword, signInWithGoogle } =
    useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!SUPABASE_ENABLED) {
    return (
      <main className={styles.page}>
        <Card variant="raised" padding="lg">
          <h1>Supabase is not set up yet</h1>
          <p>
            Copy <code>.env.example</code> to <code>.env</code> and fill in the
            values. The instructions are in{" "}
            <code>docs/02-supabase-setup.md</code>.
          </p>
        </Card>
      </main>
    );
  }

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? "/"} replace />;
  }

  async function run(action: () => Promise<void>) {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await action();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void run(() => signInWithPassword(email, password));
  }

  return (
    <main className={styles.page}>
      <Card variant="raised" padding="lg">
        <h1 className={styles.title}>Log In</h1>

        <Button
          variant="secondary"
          className={styles.fullWidth}
          disabled={busy}
          onClick={() => void run(signInWithGoogle)}
        >
          Continue with Google
        </Button>

        <div className={styles.divider}>
          <Separator />
          <span>or</span>
          <Separator />
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field label="Password" description="At least 6 characters">
            <Input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <div className={styles.actions}>
            <Button type="submit" loading={busy} className={styles.grow}>
              Log In
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const needsConfirmation = await signUpWithPassword(
                    email,
                    password,
                  );
                  if (needsConfirmation) {
                    setNotice(
                      "We sent you an email to confirm your address. Click the link in it to finish signing up.",
                    );
                  }
                })
              }
            >
              Sign Up
            </Button>
          </div>
        </form>

        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}

        {notice ? (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        ) : null}
      </Card>
    </main>
  );
}
