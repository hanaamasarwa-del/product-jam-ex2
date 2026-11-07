import { Link } from "react-router";
import { Card } from "../../components";
import styles from "./DemosPage.module.css";

/**
 * The list of demos. Each one is a small, complete example of something
 * you will probably need - open its file and read it top to bottom.
 *
 * Hidden, along with every demo, when VITE_SHOW_DEMOS=false.
 */
const DEMOS = [
  {
    title: "Blank",
    path: "/demos/blank",
    file: "client/pages/demos/BlankDemoPage.tsx",
    description: "A minimal blank slate.",
  },
  {
    title: "HTML Elements",
    path: "/demos/elements",
    file: "client/pages/demos/ElementsDemoPage.tsx",
    description:
      "This page provides an overview of common HTML elements. Use this page to see how your CSS changes the styling of these elements.",
  },
  {
    title: "Component Library",
    path: "/components",
    file: "client/pages/components/ComponentsPage.tsx",
    description:
      "Every component in client/components/, in all its states. Reach for these before building something new.",
  },
  {
    title: "Basic Data Visualization",
    path: "/demos/viz",
    file: "client/pages/demos/VizDemoPage.tsx",
    description:
      "A simple example of reading data from a public API and displaying it in a chart.",
  },
];

export default function DemosPage() {
  return (
    <main>
      <h1>Demos</h1>
      <ul className={styles.list}>
        {DEMOS.map((demo) => (
          <li key={demo.path}>
            <Card>
              <h2 className={styles.title}>{demo.title}</h2>
              <p className={styles.description}>{demo.description}</p>
              <p className={styles.footer}>
                <code>{demo.file}</code>
                <Link to={demo.path}>See it →</Link>
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
