import { useNavigate, useParams } from "react-router";
import { Card, Spinner, useToast } from "../../components";
import { EventForm } from "../../features/events/EventForm";
import { useEvent, useUpdateEvent } from "../../features/events/hooks";
import { ApiRequestError } from "../../lib/api";
import styles from "./EventDetailPage.module.css";

/** The "edit an event" page. Same form as creating, different submit. */
export default function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const eventQuery = useEvent(id);
  const updateEvent = useUpdateEvent(id ?? "");

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
        </Card>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Card padding="lg">
        <h1>Edit event</h1>
        <EventForm
          event={eventQuery.data}
          submitLabel="Save"
          pending={updateEvent.isPending}
          error={updateEvent.error}
          onCancel={() => void navigate(`/events/${id}`)}
          onSubmit={(values) =>
            updateEvent.mutate(
              {
                title: values.title,
                description: values.description || null,
                starts_at: values.starts_at,
                image_path: values.image_path,
              },
              {
                onSuccess: () => {
                  toast.add({ title: "Changes saved" });
                  void navigate(`/events/${id}`);
                },
              },
            )
          }
        />
      </Card>
    </main>
  );
}
