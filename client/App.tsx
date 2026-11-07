import { DirectionProvider } from "@base-ui/react/direction-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Spinner, ToastProvider, TooltipProvider } from "./components";
import { AuthProvider, RequireAuth } from "./lib/auth";
import { DIRECTION, SHOW_DEMOS } from "./lib/config";
import { Layout } from "./pages/Layout";

// One line per page. Each page is downloaded the first time someone visits
// it, so adding pages never slows down the rest of the app.
const HomePage = lazy(() => import("./pages/home/HomePage"));
const SignInPage = lazy(() => import("./pages/signin/SignInPage"));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const EventNewPage = lazy(() => import("./pages/events/EventNewPage"));
const EventDetailPage = lazy(() => import("./pages/events/EventDetailPage"));
const EventEditPage = lazy(() => import("./pages/events/EventEditPage"));
const DesignPage = lazy(() => import("./pages/design/DesignPage"));
const TicTacToePage = lazy(() => import("./pages/tic-tac-toe/TicTacToePage"));
const NasaPage = lazy(() => import("./pages/nasa/NasaPage"));
const ComponentsPage = lazy(() => import("./pages/components/ComponentsPage"));
const DemosPage = lazy(() => import("./pages/demos/DemosPage"));
const BlankDemoPage = lazy(() => import("./pages/demos/BlankDemoPage"));
const ElementsDemoPage = lazy(() => import("./pages/demos/ElementsDemoPage"));
const VizDemoPage = lazy(() => import("./pages/demos/VizDemoPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Holds the data fetched from the server, so two pages asking for the same
// thing only cause one request. See client/features/events/ for how it's used.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch everything the moment the user clicks back into the tab.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * The top of the browser app.
 *
 * The providers wrap everything, then the router picks a page based on the URL.
 * To add a page: make a file in client/pages/<section>/ that does
 * `export default function MyPage()`, add a lazy() line at the top of this
 * file, then a <Route> below. Put it inside <RequireAuth> if you have to be
 * logged in to see it.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectionProvider direction={DIRECTION}>
        <TooltipProvider>
          <ToastProvider>
            <BrowserRouter>
              <AuthProvider>
                {/* Shows a spinner while a page downloads. Pages inside
                <Layout> get their own, so the header stays put. */}
                <Suspense
                  fallback={
                    <main>
                      <Spinner />
                    </main>
                  }
                >
                  <Routes>
                    {/* Full-screen pages, without the header and footer. */}
                    <Route path="/signin" element={<SignInPage />} />
                    {/* The Dentify design. Public (no login, so a designer can
                    open it) and full-screen (the design has its own look). */}
                    <Route path="/design" element={<DesignPage />} />
                    <Route
                      path="/auth/callback"
                      element={<AuthCallbackPage />}
                    />

                    {/* Everything in here gets the header and footer from
                    client/pages/Layout.tsx. */}
                    <Route element={<Layout />}>
                      <Route path="/" element={<HomePage />} />

                      {/* Everything in here needs a login. */}
                      <Route element={<RequireAuth />}>
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/new" element={<EventNewPage />} />
                        <Route
                          path="/events/:id"
                          element={<EventDetailPage />}
                        />
                        <Route
                          path="/events/:id/edit"
                          element={<EventEditPage />}
                        />
                        <Route
                          path="/tic-tac-toe"
                          element={<TicTacToePage />}
                        />
                        <Route path="/nasa" element={<NasaPage />} />
                      </Route>

                      {/* The component gallery and the demos. Set
                      VITE_SHOW_DEMOS=false in .env to hide them before
                      handing the app over. */}
                      {SHOW_DEMOS ? (
                        <>
                          <Route
                            path="/components"
                            element={<ComponentsPage />}
                          />
                          <Route path="/demos" element={<DemosPage />} />
                          <Route
                            path="/demos/blank"
                            element={<BlankDemoPage />}
                          />
                          <Route
                            path="/demos/elements"
                            element={<ElementsDemoPage />}
                          />
                          <Route path="/demos/viz" element={<VizDemoPage />} />
                        </>
                      ) : null}

                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Suspense>
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </TooltipProvider>
      </DirectionProvider>
    </QueryClientProvider>
  );
}
