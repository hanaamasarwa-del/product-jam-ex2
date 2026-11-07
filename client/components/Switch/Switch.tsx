import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Switch.module.css";

export type SwitchProps = PlainClassName<
  ComponentProps<typeof BaseSwitch.Root>
> & {
  children?: ReactNode;
};

/**
 * An on/off toggle. Use it when the change happens immediately; use a
 * Checkbox when the change only happens once the form is submitted.
 */
export function Switch({ children, className, ...props }: SwitchProps) {
  return (
    <label className={cx(styles.wrapper, className)}>
      <BaseSwitch.Root className={styles.track} {...props}>
        <BaseSwitch.Thumb className={styles.thumb} />
      </BaseSwitch.Root>
      {children ? <span className={styles.label}>{children}</span> : null}
    </label>
  );
}
