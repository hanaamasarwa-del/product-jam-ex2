import { useAuth } from "../../lib/auth";
import { HomePageView } from "./HomePageView";

/**
 * The home page. It is public: you do not need to log in to see it. It only
 * asks who you are so it can show a hint to people who are not logged in.
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  return <HomePageView signedIn={loading ? null : Boolean(user)} />;
}
