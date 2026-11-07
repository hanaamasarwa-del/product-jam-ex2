import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ComponentProps, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./RadioGroup.module.css";

export type RadioGroupProps = PlainClassName<
  ComponentProps<typeof BaseRadioGroup>
> & {
  /** Use <RadioGroup.Option> for each choice. */
  children: ReactNode;
};

/**
 * Pick exactly one of several choices.
 *
 *     <RadioGroup value={size} onValueChange={setSize}>
 *       <RadioGroup.Option value="s">Small</RadioGroup.Option>
 *       <RadioGroup.Option value="m">Medium</RadioGroup.Option>
 *     </RadioGroup>
 */
export function RadioGroup({ className, children, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup className={cx(styles.group, className)} {...props}>
      {children}
    </BaseRadioGroup>
  );
}

export type RadioOptionProps = PlainClassName<
  ComponentProps<typeof Radio.Root>
> & {
  children?: ReactNode;
};

/** One choice inside a <RadioGroup>. */
function Option({ children, className, ...props }: RadioOptionProps) {
  return (
    <label className={cx(styles.option, className)}>
      <Radio.Root className={styles.circle} {...props}>
        <Radio.Indicator className={styles.dot} />
      </Radio.Root>
      {children ? <span className={styles.label}>{children}</span> : null}
    </label>
  );
}

RadioGroup.Option = Option;
