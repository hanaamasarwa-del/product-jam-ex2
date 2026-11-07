import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Button.module.css";

export type ButtonProps = PlainClassName<ComponentProps<typeof BaseButton>> & {
  /** How important is this button? */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and blocks clicks. Use while saving. */
  loading?: boolean;
};

/**
 * The standard button.
 *
 *     <Button onClick={save}>Save</Button>
 *     <Button variant="danger" onClick={remove}>Delete</Button>
 *     <Button variant="secondary" loading={isSaving}>Save</Button>
 *
 * To change how every button in the app looks, edit Button.module.css.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cx(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </BaseButton>
  );
}
