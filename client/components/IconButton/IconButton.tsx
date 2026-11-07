import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./IconButton.module.css";

export type IconButtonProps = PlainClassName<
  ComponentProps<typeof BaseButton>
> & {
  /**
   * What the button does, in words. Required, because an icon on its own
   * tells a screen reader nothing.
   */
  label: string;
  variant?: "ghost" | "secondary" | "danger";
  size?: "sm" | "md";
};

/**
 * A square button containing only an icon.
 *
 *     <IconButton label="Delete" onClick={remove}><TrashIcon /></IconButton>
 */
export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <BaseButton
      aria-label={label}
      title={label}
      className={cx(
        styles.iconButton,
        styles[variant],
        styles[size],
        className,
      )}
      {...props}
    >
      {children}
    </BaseButton>
  );
}
