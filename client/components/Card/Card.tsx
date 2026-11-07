import type { ComponentProps } from "react";
import { cx } from "../../lib/cx";
import styles from "./Card.module.css";

export type CardProps = ComponentProps<"div"> & {
  /** "raised" adds a shadow, for things that float above the page. */
  variant?: "outlined" | "raised";
  padding?: "none" | "sm" | "md" | "lg";
};

/**
 * A box that groups related things together.
 *
 * Base UI has no card - there is no behaviour to get right, only styling.
 *
 *     <Card><h2>Event</h2><p>...</p></Card>
 */
export function Card({
  variant = "outlined",
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cx(
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className,
      )}
      {...props}
    />
  );
}
