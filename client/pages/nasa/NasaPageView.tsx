import type { ApodPicture } from "@shared/schemas/nasa";
import type { ReactNode } from "react";
import { Button, Card, Spinner } from "../../components";
import styles from "./NasaPage.module.css";

type NasaPageViewProps = {
  status: "loading" | "error" | "ready";
  pictures: readonly ApodPicture[];
  errorMessage?: string;
  /** True while a selection is being fetched (the button waits). */
  busy: boolean;
  onMore: () => void;
  onRetry: () => void;
  /** Draws one picture. The page passes the real card; tests pass a simple one. */
  renderPicture: (picture: ApodPicture) => ReactNode;
};

/**
 * The /nasa screen. A fetched list is never only "with data in it": it is also
 * loading, it can fail, and it can be empty. All four are drawn here.
 */
export function NasaPageView({
  status,
  pictures,
  errorMessage,
  busy,
  onMore,
  onRetry,
  renderPicture,
}: NasaPageViewProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Space pictures</h1>
          <p className={styles.intro}>
            Random pictures from NASA&rsquo;s Astronomy Picture of the Day. Ask
            for a picture to be explained in Hebrew.
          </p>
        </div>
        <Button onClick={onMore} disabled={busy}>
          Show other pictures
        </Button>
      </header>

      {status === "loading" ? (
        <div className={styles.centered}>
          <Spinner size="lg" label="Loading pictures from NASA" />
          <p>Asking NASA for pictures. This can take a few seconds.</p>
        </div>
      ) : status === "error" ? (
        <Card padding="lg" className={styles.problem}>
          <p role="alert">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </Card>
      ) : pictures.length === 0 ? (
        <Card padding="lg">
          <p className={styles.empty}>No pictures came back. Try again.</p>
        </Card>
      ) : (
        <ul className={styles.grid}>
          {pictures.map((picture) => (
            <li key={picture.date}>{renderPicture(picture)}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
