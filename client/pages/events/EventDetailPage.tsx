import { Link, useNavigate, useParams } from "react-router";
import { Button, Card, Spinner } from "../../components";
import { formatEventDate } from "../../features/events/dates";
import { useEvent } from "../../features/events/hooks";
import { ApiRequestError } from "../../lib/api";
import { LANG } from "../../lib/config";
import styles from "./EventDetailPage.module.css";

/** One event, with a link to edit it. */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventQuery = useEvent(id);

  if (eventQuery.isPending) {
    return (
      <main className={styles.page}>
        <div className={styles.centered}>
          <Spinner size="lg" />
        </div>
      </main>
    );
  }

  if (eventQuery.isError) {
    const message =
      eventQuery.error instanceof ApiRequestError
        ? eventQuery.error.message
        : "Could not load the event.";
    return (
      <main className={styles.page}>
        <Card padding="lg">
          <p role="alert">{message}</p>
          <Link to="/events">Back to the list</Link>
        </Card>
      </main>
    );
  }

  const event = eventQuery.data;

  return (
    <main className={styles.page}>
      <Card padding="lg">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className={styles.image}
            loading="lazy"
          />
        ) : null}

        <h1>{event.title}</h1>
        <p className={styles.date}>{formatEventDate(event.starts_at, LANG)}</p>
        {event.description ? (
          <p className={styles.description}>{event.description}</p>
        ) : null}

        <div className={styles.actions}>
          <Button onClick={() => void navigate(`/events/${event.id}/edit`)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => void navigate("/events")}>
            Back to the list
          </Button>
        </div>
      </Card>
    </main>
  );
}
