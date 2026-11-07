import { replay } from "@shared/game/rules";
import { Link } from "react-router";
import dentifyLogo from "../design/assets/logo.png";
import styles from "./HomePage.module.css";

/*
 * The home page: a short introduction and one card for each project.
 *
 * It does not call the server and needs no login, so anyone can open it. The
 * cards link to the three projects. Two of them ask you to log in; if you are
 * not, the login page sends you back to the project you chose.
 *
 * This file is only what is drawn. `HomePage.tsx` adds the login state.
 */

type Access = "login" | "public";

type Project = {
  id: "tic-tac-toe" | "nasa" | "dentify";
  /** Where the card goes. */
  to: string;
  title: string;
  description: string;
  access: Access;
};

/** The three projects. They are separate pieces of work, not one product. */
const PROJECTS: readonly Project[] = [
  {
    id: "tic-tac-toe",
    to: "/tic-tac-toe",
    title: "Tic-tac-toe",
    description:
      "A 4×4 board where three in a row wins. Two players share one screen, and each finished game is checked by the server and saved to your history.",
    access: "login",
  },
  {
    id: "nasa",
    to: "/nasa",
    title: "NASA Space Pictures",
    description:
      "Random pictures from NASA's Astronomy Picture of the Day, each with a button for a short Hebrew explanation written by an AI.",
    access: "login",
  },
  {
    id: "dentify",
    to: "/design",
    title: "Dentify",
    description:
      "A music-streaming concept for dentists and patients, built from a designer's Figma and made to work on every screen size.",
    access: "public",
  },
];

const ACCESS_LABEL: Record<Access, string> = {
  login: "Login required",
  public: "Open to everyone",
};

// ---------------------------------------------------------------------------
// The small pictures at the top of each card. They are decoration only, so
// screen readers skip them: the title and the description say what the card is.
// ---------------------------------------------------------------------------

/**
 * A real finished game, played with the same rules the game uses: X, O, X, O,
 * then X completes a diagonal of three.
 */
const DEMO_MOVES = [0, 1, 5, 6, 10];

function BoardArt() {
  const game = replay(DEMO_MOVES);
  if (!game.ok) return null;
  const { board, winningLine } = game.state;
  return (
    <div className={styles.board}>
      {board.map((mark, cell) => (
        <span
          key={cell}
          className={styles.cell}
          data-mark={mark ?? undefined}
          data-win={winningLine?.includes(cell) || undefined}
        >
          {mark}
        </span>
      ))}
    </div>
  );
}

function SpaceArt() {
  return <div className={styles.planet} />;
}

function DentifyArt() {
  return (
    <img
      src={dentifyLogo}
      alt=""
      width={382}
      height={121}
      className={styles.logo}
    />
  );
}

const ART: Record<Project["id"], () => React.ReactElement | null> = {
  "tic-tac-toe": BoardArt,
  nasa: SpaceArt,
  dentify: DentifyArt,
};

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className={styles.arrow}
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------

function ProjectCard({ project }: { project: Project }) {
  const Art = ART[project.id];
  const descriptionId = `${project.id}-description`;
  return (
    <li className={styles.card} data-project={project.id}>
      <div className={styles.art} aria-hidden="true">
        <Art />
      </div>

      <div className={styles.body}>
        <p className={styles.badge} data-access={project.access}>
          {ACCESS_LABEL[project.access]}
        </p>
        <h2 className={styles.title}>
          {/* The one link on the card. Its box is stretched over the whole card
              in the CSS, so the whole card is the link. */}
          <Link
            to={project.to}
            className={styles.link}
            aria-describedby={descriptionId}
          >
            {project.title}
          </Link>
        </h2>
        <p id={descriptionId} className={styles.description}>
          {project.description}
        </p>
        <span className={styles.cta} aria-hidden="true">
          Open <Arrow />
        </span>
      </div>
    </li>
  );
}

/**
 * `signedIn` is `null` while we are still finding out, so nothing flickers.
 */
export function HomePageView({ signedIn }: { signedIn: boolean | null }) {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Product Jam · Assignment 2</p>
        <h1 className={styles.heading}>Three projects</h1>
        <p className={styles.lede}>
          A game, a space-pictures page and a responsive design. Each one stands
          on its own, so pick whichever you like.
        </p>
      </header>

      <ul className={styles.cards} role="list">
        {PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </ul>

      {signedIn === false ? (
        <p className={styles.note}>
          Tic-tac-toe and NASA Space Pictures need an account.{" "}
          <Link to="/signin">Log in</Link> and you will land on the one you
          chose.
        </p>
      ) : null}
    </main>
  );
}
