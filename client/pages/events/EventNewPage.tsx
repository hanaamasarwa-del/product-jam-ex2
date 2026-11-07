import { useNavigate } from "react-router";
import { Card, useToast } from "../../components";
import { EventForm } from "../../features/events/EventForm";
import { useCreateEvent } from "../../features/events/hooks";
import styles from "./EventDetailPage.module.css";

/** The "create an event" page. */
export default function EventNewPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createEvent = useCreateEvent();

  return (
    <main className={styles.page}>
      <Card padding="lg">
        <h1>New event</h1>
        <EventForm
          submitLabel="Create"
          pending={createEvent.isPending}
          error={createEvent.error}
          onCancel={() => void navigate("/events")}
          onSubmit={(values) =>
            createEvent.mutate(
              {
                title: values.title,
                description: values.description || null,
                starts_at: values.starts_at,
                image_path: values.image_path,
              },
              {
                onSuccess: (created) => {
                  toast.add({ title: "Event created" });
                  void navigate(`/events/${created.id}`);
                },
              },
            )
          }
        />
      </Card>
    </main>
  );
}
