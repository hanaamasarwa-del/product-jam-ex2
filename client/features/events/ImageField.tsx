import { useRef, useState } from "react";
import { Button, Field, Spinner } from "../../components";
import { ApiRequestError } from "../../lib/api";
import { useUploadImage } from "./hooks";
import styles from "./ImageField.module.css";

/**
 * Pick an image, upload it, show it.
 *
 * The upload happens as soon as a file is chosen, so there is nothing left
 * to wait for when the form is submitted. What it reports upward is the
 * stored path, not the file.
 */
export function ImageField({
  imageUrl,
  onChange,
}: {
  /** Link to the image already saved on this event, if any. */
  imageUrl: string | null;
  /** Called with the new stored path, or null when the image is removed. */
  onChange: (path: string | null) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(imageUrl);
  const upload = useUploadImage();

  const error =
    upload.error instanceof ApiRequestError
      ? upload.error.message
      : upload.error
        ? "The upload failed."
        : null;

  function pick(file: File | undefined) {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: (result) => {
        setShown(result.url);
        onChange(result.path);
      },
    });
  }

  function remove() {
    setShown(null);
    onChange(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <Field
      label="Image"
      description="JPEG, PNG, GIF or WebP. Up to 5 MB."
      error={error}
    >
      <div className={styles.wrapper}>
        {shown ? (
          <img src={shown} alt="" className={styles.preview} />
        ) : (
          <div className={styles.placeholder} />
        )}

        <div className={styles.actions}>
          {/* Hidden, because styling a file input across browsers is a
              fight not worth having. The button opens it instead. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className={styles.input}
            onChange={(event) => pick(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={upload.isPending}
            onClick={() => fileInput.current?.click()}
          >
            {shown ? "Replace image" : "Choose image"}
          </Button>

          {shown ? (
            <Button type="button" variant="ghost" size="sm" onClick={remove}>
              Remove
            </Button>
          ) : null}

          {upload.isPending ? <Spinner size="sm" /> : null}
        </div>
      </div>
    </Field>
  );
}
