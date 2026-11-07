import type { ApodPicture } from "@shared/schemas/nasa";
import { Button, Card, Spinner } from "../../components";
import { LANG } from "../../lib/config";
import { formatPictureDate } from "./labels";
import styles from "./PictureCard.module.css";

export type ExplainStatus = "idle" | "pending" | "error";

type PictureCardViewProps = {
  picture: ApodPicture;
  /** What is happening with the Hebrew explanation of this picture. */
  status: ExplainStatus;
  errorMessage?: string;
  onExplain: () => void;
};

/**
 * One picture: NASA's image, date, title and explanation, and either the
 * Hebrew explanation or a button to ask for it.
 *
 * It only draws what it is given. `PictureCard` connects it to the server.
 * All the text here came from NASA and Gemini through our server and is shown
 * as plain text, never as HTML.
 */
export function PictureCardView({
  picture,
  status,
  errorMessage,
  onExplain,
}: PictureCardViewProps) {
  const isVideo = picture.media_type === "video";
  const { hebrew } = picture;

  return (
    <Card padding="none" className={styles.card}>
      <img
        src={picture.url}
        alt={picture.alt ?? picture.title}
        loading="lazy"
        className={styles.image}
      />

      <div className={styles.body}>
        <p className={styles.date}>
          <time dateTime={picture.date}>
            {formatPictureDate(picture.date, LANG)}
          </time>
          {isVideo ? <span className={styles.badge}>Video</span> : null}
        </p>

        <h2 className={styles.title}>{picture.title}</h2>

        {isVideo && picture.link ? (
          <p>
            <a href={picture.link} target="_blank" rel="noopener noreferrer">
              Watch the video on NASA
            </a>
          </p>
        ) : null}

        <p className={styles.explanation}>{picture.explanation}</p>

        {picture.copyright ? (
          <p className={styles.credit}>Credit: {picture.copyright}</p>
        ) : null}

        {hebrew ? (
          <section
            lang="he"
            dir="rtl"
            aria-label="Hebrew explanation"
            className={styles.hebrew}
          >
            <h3 className={styles.hebrewTitle}>{hebrew.title_he}</h3>
            <p>{hebrew.summary_he}</p>
            <ul className={styles.tags} lang="en" dir="ltr">
              {hebrew.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={onExplain}
              loading={status === "pending"}
            >
              {status === "error" ? "Try again" : "Explain in Hebrew"}
            </Button>

            <div aria-live="polite">
              {status === "pending" ? (
                <p className={styles.working}>
                  <Spinner size="sm" label="Gemini is writing" /> Gemini is
                  writing the explanation. This can take up to half a minute.
                </p>
              ) : null}
              {status === "error" ? (
                <p role="alert" className={styles.error}>
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
