import type { ComponentProps } from "react";
import { cx } from "../../lib/cx";
import styles from "./Textarea.module.css";

export type TextareaProps = ComponentProps<"textarea">;

/**
 * A multi-line text box. Base UI has no textarea, so this is a plain one
 * styled to match <Input>. Put it inside a <Field>.
 */
export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      className={cx(styles.textarea, className)}
      rows={rows}
      {...props}
    />
  );
}
