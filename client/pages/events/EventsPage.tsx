import { Link, useNavigate } from "react-router";
import {
  AlertDialog,
  Button,
  Card,
  IconButton,
  Spinner,
  useToast,
} from "../../components";
import { formatEventDate } from "../../features/events/dates";
import { useDeleteEvent, useEvents } from "../../features/events/hooks";
import { LANG } from "../../lib/config";
import styles from "./EventsPage.module.css";

/**
 * The list of events. Shows all four states a fetched list can be in:
 * loading, failed, empty, and populated. Handle all four in your own pages
 * too - "it works with data in it" is not enough.
 */
export default function EventsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const eventsQuery = useEvents();
  const deleteEvent = useDeleteEvent();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Events</h1>
        <Button onClick={() => void navigate("/events/new")}>New event</Button>
      </header>

      {eventsQuery.isPending ? (
        <div className={styles.centered}>
          <Spinner size="lg" />
        </div>
      ) : eventsQuery.isError ? (
        <Card padding="lg">
          <p role="alert">Could not load the events.</p>
          <Button
            variant="secondary"
            onClick={() => void eventsQuery.refetch()}
          >
            Try again
          </Button>
        </Card>
      ) : eventsQuery.data.length === 0 ? (
        <Card padding="lg">
          <p className={styles.empty}>
            No events yet. Time to create the first one.
          </p>
        </Card>
      ) : (
        <ul className={styles.list}>
          {eventsQuery.data.map((event) => (
            <li key={event.id}>
              <Card className={styles.item}>
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt=""
                    className={styles.thumb}
                    loading="lazy"
                  />
                ) : null}

                <div className={styles.itemText}>
                  <Link to={`/events/${event.id}`} className={styles.itemTitle}>
                    {event.title}
                  </Link>
                  <p className={styles.itemDate}>
                    {formatEventDate(event.starts_at, LANG)}
                  </p>
                </div>

                <AlertDialog
                  trigger={
                    <IconButton
                      label={`Delete ${event.title}`}
                      variant="danger"
                    >
                      <TrashIcon />
                    </IconButton>
                  }
                  title={`Delete "${event.title}"?`}
                  description="This cannot be undone."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() =>
                    deleteEvent.mutate(event.id, {
                      onSuccess: () => toast.add({ title: "Event deleted" }),
                      onError: () =>
                        toast.add({ title: "Delete failed", type: "error" }),
                    })
                  }
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path
        d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8h6l.5-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
