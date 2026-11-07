import { Separator as BaseSeparator } from "@base-ui/react/separator";
import type { ComponentProps } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Separator.module.css";

export type SeparatorProps = PlainClassName<
  ComponentProps<typeof BaseSeparator>
>;

/** A dividing line between sections. */
export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <BaseSeparator className={cx(styles.separator, className)} {...props} />
  );
}
