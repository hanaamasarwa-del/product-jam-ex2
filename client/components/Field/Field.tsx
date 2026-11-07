import { Field as BaseField } from "@base-ui/react/field";
import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import styles from "./Field.module.css";

export type FieldProps = {
  /** The visible label. Always give one. */
  label: ReactNode;
  /** Optional hint shown under the label, before the user types. */
  description?: ReactNode;
  /**
   * An error message. Pass the one the server sent back, e.g.
   * `error.fields?.title`. When set, the control is marked invalid.
   */
  error?: string | null;
  /** The input, textarea, select or checkbox this label belongs to. */
  children: ReactNode;
  className?: string;
};

/**
 * Wraps a form control with its label, hint and error message, and wires
 * them together for screen readers so you do not have to manage `id`,
 * `aria-describedby` and `aria-invalid` by hand.
 *
 *     <Field label="Title" error={fieldErrors.title}>
 *       <Input name="title" value={title} onChange={...} />
 *     </Field>
 */
export function Field({
  label,
  description,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <BaseField.Root
      className={cx(styles.field, className)}
      invalid={Boolean(error)}
    >
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      {description ? (
        <BaseField.Description className={styles.description}>
          {description}
        </BaseField.Description>
      ) : null}
      {children}
      {error ? (
        // `match` tells Base UI when to show this. We pass `true` because we
        // are showing an error the SERVER sent back, not one the browser found.
        <BaseField.Error match className={styles.error}>
          {error}
        </BaseField.Error>
      ) : null}
    </BaseField.Root>
  );
}
