import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import styles from "./HomePage.module.css";

type Me = { id: string; email: string };

/**
 * The home page. Replace all of this with your own app.
 *
 * Once you are logged in, it shows the two halves of the system talking to
 * each other: the browser knows who you are from Supabase, and /api/me
 * proves the SERVER agrees - it checked your token before answering.
 */
export default function HomePage() {
  const { user } = useAuth();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/api/me"),
    // Only ask once we know somebody is logged in.
    enabled: Boolean(user),
  });

  return (
    <main>
      <h2>Welcome to the Product Jam Starter Kit</h2>
      <p>
        Feel free to look around, edit the source code and navigate to the
        demos. This page is client/pages/home/HomePage.tsx.
      </p>

      <div className={styles.logos}>
        <img src="/huji.svg" alt="HUJI Logo" width="80" height="80" />
        <img src="/bezalel.svg" alt="Bezalel Logo" width="80" height="80" />
      </div>

      {user ? (
        <>
          <p>
            The server knows you as:{" "}
            <strong>
              {meQuery.isPending
                ? "Checking..."
                : meQuery.isError
                  ? "Error"
                  : meQuery.data.email}
            </strong>
          </p>
          <p>
            <Link to="/events">My events</Link>
          </p>
        </>
      ) : null}

      <h2>Lorem Ipsum</h2>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec faucibus
        sit amet nunc nec vehicula. Fusce ornare nec nulla non imperdiet. Fusce
        vel sodales justo. Sed efficitur arcu lorem, at iaculis odio ultricies
        et. Duis rutrum urna nec elit bibendum, sed hendrerit nulla posuere.
        Vestibulum vestibulum, ante non tincidunt posuere, dui arcu lacinia
        nisl, nec rhoncus massa arcu ac ipsum. Nam congue interdum tortor, eu
        dignissim massa scelerisque vitae.
      </p>
      <ul>
        <li>
          Aliquam maximus tellus sed lacus venenatis, ac cursus eros mollis.
        </li>
        <li>In id ante sed sem pharetra molestie et vitae arcu.</li>
        <li>Cras pharetra turpis at pretium elementum.</li>
        <li>Donec ultrices felis vel lectus auctor iaculis.</li>
      </ul>
    </main>
  );
}
