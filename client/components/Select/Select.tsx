import { Select as BaseSelect } from "@base-ui/react/select";
import type { ComponentProps, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Select.module.css";

export type SelectOption = { value: string; label: string };

export type SelectProps = PlainClassName<
  Omit<ComponentProps<typeof BaseSelect.Root>, "children">
> & {
  options: SelectOption[];
  placeholder?: string;
  children?: ReactNode;
};

/**
 * Pick one option from a list.
 *
 *     <Field label="Category">
 *       <Select
 *         options={[{ value: "a", label: "Event" }]}
 *         value={category}
 *         onValueChange={setCategory}
 *       />
 *     </Field>
 */
export function Select({
  options,
  placeholder = "Choose...",
  className,
  ...props
}: SelectProps) {
  return (
    <BaseSelect.Root {...props}>
      <BaseSelect.Trigger className={cx(styles.trigger, className)}>
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon className={styles.icon}>
          <ChevronDown />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      {/* Portal renders the list at the end of <body>, so it can never be
          clipped by a parent with `overflow: hidden`. */}
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} className={styles.positioner}>
          <BaseSelect.Popup className={styles.popup}>
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className={styles.item}
              >
                <BaseSelect.ItemIndicator className={styles.itemIndicator}>
                  <CheckMark />
                </BaseSelect.ItemIndicator>
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m3 4.5 3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
