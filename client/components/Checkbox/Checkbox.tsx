import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Checkbox.module.css";

export type CheckboxProps = PlainClassName<
  ComponentProps<typeof BaseCheckbox.Root>
> & {
  /** The text next to the box. */
  children?: ReactNode;
};

/**
 * A box you can tick.
 *
 *     <Checkbox checked={agreed} onCheckedChange={setAgreed}>
 *       I agree to the terms
 *     </Checkbox>
 */
export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <label className={cx(styles.wrapper, className)}>
      <BaseCheckbox.Root className={styles.box} {...props}>
        <BaseCheckbox.Indicator className={styles.indicator}>
          <CheckMark />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {children ? <span className={styles.label}>{children}</span> : null}
    </label>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M1 5.5 4.2 8.7 11 1.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
