import type { Event } from "@shared/schemas/events";
import { useState, type FormEvent } from "react";
import { Button, Field, Input, Textarea } from "../../components";
import { ApiRequestError } from "../../lib/api";
import { isoToLocalInput, localInputToIso } from "./dates";
import { ImageField } from "./ImageField";
import styles from "./EventForm.module.css";

export type EventFormValues = {
  title: string;
  description: string;
  starts_at: string;
  image_path: string | null;
};

/**
 * The form for creating and editing an event. One form for both, because
 * the fields are identical - only what happens on submit differs.
 *
 * Note how the server's per-field errors land next to the right input:
 * `error.fields.title` comes straight from the Zod schema in
 * shared/schemas/events.ts.
 */
export function EventForm({
  event,
  submitLabel,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  /** Pass an existing event to edit it, or nothing to create a new one. */
  event?: Event;
  submitLabel: string;
  onSubmit: (values: EventFormValues) => void;
  onCancel?: () => void;
  pending: boolean;
  error: unknown;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startsAt, setStartsAt] = useState(
    event ? isoToLocalInput(event.starts_at) : "",
  );
  const [imagePath, setImagePath] = useState(event?.image_path ?? null);

  const fieldErrors =
    error instanceof ApiRequestError ? (error.fields ?? {}) : {};
  const generalError =
    error instanceof ApiRequestError && !error.fields
      ? error.message
      : error && !(error instanceof ApiRequestError)
        ? "Something went wrong. Please try again."
        : null;

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    onSubmit({
      title,
      description,
      starts_at: localInputToIso(startsAt),
      image_path: imagePath,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Field label="Title" error={fieldErrors.title}>
        <Input
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field label="When" error={fieldErrors.starts_at}>
        <Input
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </Field>

      <Field
        label="Description"
        description="Optional"
        error={fieldErrors.description}
      >
        <Textarea
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <ImageField imageUrl={event?.image_url ?? null} onChange={setImagePath} />

      <div className={styles.actions}>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>

      {generalError ? (
        <p role="alert" className={styles.error}>
          {generalError}
        </p>
      ) : null}
    </form>
  );
}
