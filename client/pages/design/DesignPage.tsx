import type { ReactNode } from "react";
import artDentist from "./assets/art-dentist.png";
import artPatient from "./assets/art-patient.png";
import avatarArt from "./assets/avatar-art.png";
import avatarFill from "./assets/avatar-fill.png";
import avatarRing from "./assets/avatar-ring.png";
import cardDot from "./assets/card-dot.png";
import cardRing from "./assets/card-ring.png";
import labelDentist from "./assets/label-dentist.png";
import labelPatient from "./assets/label-patient.png";
import logo from "./assets/logo.png";
import photoBlurred from "./assets/photo-blurred.png";
import play from "./assets/play.svg";
import privacyDot from "./assets/privacy-dot.png";
import privacyFill from "./assets/privacy-fill.png";
import privacyRing from "./assets/privacy-ring.png";
import swirl from "./assets/swirl.svg";
import tooth from "./assets/tooth.svg";
import { SHOW_SECTIONS, copy, type Run, type ShowSections } from "./content";
import styles from "./DesignPage.module.css";

/*
 * The Dentify design, built from the Figma frame: a PNG of the whole frame for
 * how it looks, and the Figma export for the words, colours and measurements.
 * Neither file is kept in this repository.
 *
 * FOUR LAYOUTS, ONE PAGE (the CSS decides, the markup is the same)
 *   - Phone (up to 639px): the Figma frame, scaled smoothly down to 320px.
 *   - Tablet (640px to 1023px): a centred column with wide cards.
 *   - Desktop (1024px to 1439px): a two-column page.
 *   - Large desktop (1440px and up): the same, held to a maximum width.
 * The Figma only shows a phone, so the three wider layouts are proposals. Each
 * choice is marked DESIGNER DECISION in DesignPage.module.css.
 *
 * Cards and the player scale with their own width (CSS container queries), so a
 * card looks the same at any size instead of being positioned in pixels.
 *
 * This page is PUBLIC and does not talk to the server: a designer can run it on
 * their own computer without a .env file. Keep it that way.
 *
 * Nothing here does anything yet. The design says what the buttons look like,
 * not where they go, so they are buttons that do nothing until it does.
 */

/**
 * The photo on each card of the shelf, left to right. `null` means the Figma
 * export had no photo for that card (the picture was a 1 pixel placeholder).
 * A card with no photo is never shown on a wide screen, and on a phone it only
 * appears as the edge of a neighbour, as in the design. To fill one in, add the
 * image to ./assets and import it here: the card appears by itself.
 */
const SHELF_PHOTOS: (string | null)[] = [null, photoBlurred, null];

/** Text that mixes bold and normal, like the Hebrew introduction. */
function Runs({ runs }: { runs: readonly Run[] }) {
  return (
    <>
      {runs.map((run, index) =>
        run.bold ? (
          <strong key={index}>{run.text}</strong>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </>
  );
}

function PlayIcon() {
  return (
    <img src={play} alt="" width={25} height={25} className={styles.playIcon} />
  );
}

// ---------------------------------------------------------------------------
// The top of the page: logo, player card, introduction
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <header className={styles.hero}>
      <h1 className={styles.logo}>
        <img src={logo} alt={copy.logoAlt} width={382} height={121} />
      </h1>

      <div className={styles.player}>
        <div className={styles.playerBody}>
          <p className={styles.playerTitle}>{copy.player.title}</p>
          <div className={styles.playerRow}>
            <button type="button" className={styles.playButton}>
              <PlayIcon />
              <span className={styles.visuallyHidden}>
                {copy.player.playLabel}
              </span>
            </button>
            <span className={styles.playerLabel} aria-hidden="true">
              {copy.player.playLabel}
            </span>
          </div>
        </div>
      </div>

      <p className={styles.intro} lang="he" dir="rtl">
        <Runs runs={copy.intro} />
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Patient and Dentist: a heading, its caption and its card, together
// ---------------------------------------------------------------------------

function FeatureCard({
  who,
  label,
  art,
  artAlt,
  title,
  body,
  action,
}: {
  who: "patient" | "dentist";
  label: string;
  art: string;
  artAlt: string;
  title: string;
  body: string;
  action: string;
}) {
  return (
    <article className={styles.featureCard}>
      <div className={styles.featurePanel}>
        <p className={styles.featureLabel}>{label}</p>

        {/* The ring, dot and illustration scale together with this box. */}
        <div className={styles.featureArt} data-who={who}>
          <img
            src={cardRing}
            alt=""
            width={156}
            height={156}
            className={styles.featureRing}
          />
          <img
            src={cardDot}
            alt=""
            width={13}
            height={13}
            className={styles.featureDot}
          />
          <img src={art} alt={artAlt} className={styles.featureFigure} />
        </div>

        <div className={styles.featureText}>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
      </div>
      <button type="button" className={styles.featureAction}>
        {action}
      </button>
    </article>
  );
}

/**
 * On a phone the two headings sit in a row above the two cards, as in the
 * design. On a wider screen each heading belongs to its own card. It is the
 * same markup either way: the CSS decides.
 */
function Audiences() {
  const { audiences, features } = copy;
  return (
    <section className={styles.audiences}>
      <div className={styles.audience} data-who="patient">
        <div className={styles.audienceHead}>
          <img
            src={labelPatient}
            alt={audiences.patientAlt}
            width={144}
            height={55}
          />
          <p lang="he" dir="rtl">
            {audiences.patientCaption}
          </p>
        </div>
        <FeatureCard who="patient" art={artPatient} {...features.patient} />
      </div>

      <div className={styles.audience} data-who="dentist">
        <div className={styles.audienceHead}>
          <img
            src={labelDentist}
            alt={audiences.dentistAlt}
            width={141}
            height={55}
          />
          <p lang="he" dir="rtl">
            {audiences.dentistCaption}
          </p>
        </div>
        <FeatureCard who="dentist" art={artDentist} {...features.dentist} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Left out for now: see SHOW_SECTIONS in content.ts
// ---------------------------------------------------------------------------

function TypographyNote() {
  const note = copy.typographyNote;
  return (
    <section className={styles.typographyNote} aria-label="Typography note">
      <img
        src={swirl}
        alt=""
        width={377}
        height={650}
        className={styles.swirl}
      />
      <div className={styles.specimen}>
        <p className={styles.specimenTitle}>{note.latinTitle}</p>
        <p className={styles.specimenBody}>
          <Runs runs={note.latinRuns} />
          <br />
          {note.latinBody}
        </p>
      </div>
      <div className={styles.specimen} lang="he" dir="rtl">
        <p className={styles.specimenTitle}>{note.hebrewTitle}</p>
        <p className={styles.specimenBody}>
          <Runs runs={note.hebrewRuns} />
          <br />
          {note.hebrewBody}
        </p>
      </div>
    </section>
  );
}

function PrivacyNote() {
  return (
    <section className={styles.privacyNote} aria-label="Privacy note">
      <div className={styles.privacyArt}>
        <img
          src={privacyFill}
          alt=""
          width={276}
          height={276}
          className={styles.privacyFill}
        />
        <img
          src={privacyRing}
          alt=""
          width={336}
          height={336}
          className={styles.privacyRing}
        />
        <img
          src={privacyDot}
          alt=""
          width={13}
          height={13}
          className={styles.privacyDot}
        />
        <p lang="he" dir="rtl" className={styles.privacyText}>
          {copy.privacyNote}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The mock of the app's screen
// ---------------------------------------------------------------------------

function Greeting() {
  return (
    <div className={styles.greeting}>
      <div className={styles.avatar}>
        <img
          src={avatarFill}
          alt=""
          width={48}
          height={48}
          className={styles.avatarFill}
        />
        <img
          src={avatarArt}
          alt={copy.preview.avatarAlt}
          width={41}
          height={39}
          className={styles.avatarArt}
        />
        <img
          src={avatarRing}
          alt=""
          width={59}
          height={59}
          className={styles.avatarRing}
        />
      </div>
      <p>{copy.preview.greeting}</p>
    </div>
  );
}

function Chips() {
  return (
    <ul className={styles.chips}>
      {copy.preview.chips.map((chip) => (
        <li key={chip} className={styles.chip}>
          {chip}
        </li>
      ))}
    </ul>
  );
}

/**
 * One card on the shelf. A card with no photo is only the edge of a neighbour
 * on a phone, as in the design, and is hidden from everyone else (it is
 * `aria-hidden`, and the CSS removes it on a wider screen).
 */
function ShelfCard({ photo }: { photo: string | null }) {
  return (
    <div
      className={styles.shelfCard}
      data-photo={photo ? "yes" : "missing"}
      aria-hidden={photo ? undefined : true}
    >
      <div className={styles.shelfBody}>
        {photo ? (
          <img
            src={photo}
            alt=""
            width={222}
            height={154}
            className={styles.shelfPhoto}
          />
        ) : null}
        <span className={styles.shelfPlay} aria-hidden="true">
          <PlayIcon />
        </span>
        <p className={styles.shelfTitle}>{copy.preview.cardTitle}</p>
      </div>
    </div>
  );
}

function Preview() {
  return (
    <section className={styles.preview} aria-label="The app">
      <div className={styles.panelHead}>
        <Greeting />
        <Chips />
      </div>
      <h2 className={styles.shelfHeading}>{copy.preview.shelfTitle}</h2>
      <div
        className={styles.shelf}
        data-cards={SHELF_PHOTOS.filter(Boolean).length}
      >
        <div className={styles.shelfTrack}>
          {SHELF_PHOTOS.map((photo, index) => (
            <ShelfCard key={index} photo={photo} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Credits() {
  return (
    <footer className={styles.credits}>
      <div className={styles.creditNames}>
        <p lang="he" dir="rtl">
          {copy.credits.hebrew}
        </p>
        <p>{copy.credits.latin}</p>
      </div>
      <img src={tooth} alt="" width={50} height={50} className={styles.tooth} />
    </footer>
  );
}

// ---------------------------------------------------------------------------

/**
 * The page. `show` lets a test (or you) turn the left-out sections on without
 * touching content.ts.
 */
export function DesignPageView({
  show = SHOW_SECTIONS,
}: {
  show?: ShowSections;
}) {
  const optional: ReactNode[] = [];
  if (show.typographyNote) optional.push(<TypographyNote key="typography" />);
  if (show.privacyNote) optional.push(<PrivacyNote key="privacy" />);

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        <Hero />
        <Audiences />
        {optional}
        <Preview />
        <Credits />
      </div>
    </main>
  );
}

export default function DesignPage() {
  return <DesignPageView />;
}
