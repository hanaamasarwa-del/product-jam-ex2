import type { ComponentProps } from "react";
import { cx } from "../../lib/cx";
import styles from "./Spinner.module.css";

export type SpinnerProps = ComponentProps<"span"> & {
  size?: "sm" | "md" | "lg";
  /** Announced to screen readers while it spins. */
  label?: string;
};

/**
 * A "working on it" indicator.
 *
 * Base UI has no spinner, so this is ours: a bordered circle that rotates.
 *
 *     {isPending ? <Spinner /> : <EventList />}
 */
export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cx(styles.wrapper, className)}
      {...props}
    >
      <span className={cx(styles.spinner, styles[size])} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
