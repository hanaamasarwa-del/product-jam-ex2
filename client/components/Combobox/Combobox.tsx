import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type { ComponentProps } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Combobox.module.css";

export type ComboboxOption = { value: string; label: string };

export type ComboboxProps = PlainClassName<
  Omit<
    ComponentProps<typeof BaseCombobox.Root<ComboboxOption>>,
    "children" | "items"
  >
> & {
  options: ComboboxOption[];
  placeholder?: string;
  emptyMessage?: string;
};

/**
 * A Select you can type into, to narrow a long list.
 *
 *     <Field label="City">
 *       <Combobox options={cities} value={city} onValueChange={setCity} />
 *     </Field>
 *
 * Use it instead of Select once the list is long enough that scrolling it
 * is annoying - roughly ten options.
 */
export function Combobox({
  options,
  placeholder = "Search...",
  emptyMessage = "No results",
  className,
  ...props
}: ComboboxProps) {
  return (
    <BaseCombobox.Root items={options} {...props}>
      <div className={cx(styles.control, className)}>
        <BaseCombobox.Input
          placeholder={placeholder}
          className={styles.input}
        />
        <BaseCombobox.Trigger className={styles.trigger}>
          <BaseCombobox.Icon className={styles.icon}>
            <ChevronDown />
          </BaseCombobox.Icon>
        </BaseCombobox.Trigger>
      </div>

      <BaseCombobox.Portal>
        <BaseCombobox.Positioner sideOffset={4} className={styles.positioner}>
          <BaseCombobox.Popup className={styles.popup}>
            <BaseCombobox.Empty className={styles.empty}>
              {emptyMessage}
            </BaseCombobox.Empty>
            <BaseCombobox.List>
              {(option: ComboboxOption) => (
                <BaseCombobox.Item
                  key={option.value}
                  value={option}
                  className={styles.item}
                >
                  {option.label}
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
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
