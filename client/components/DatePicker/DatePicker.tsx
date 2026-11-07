import { lazy, Suspense } from "react";
import { LANG } from "../../lib/config";
import { cx } from "../../lib/cx";
import { Popover } from "../Popover";
import { Spinner } from "../Spinner";
import styles from "./DatePicker.module.css";

/*
 * The calendar is loaded only when someone actually opens the picker.
 *
 * react-day-picker is a sizeable library, and most visitors never open a
 * date field. Importing it lazily keeps it out of the file every visitor
 * downloads; it arrives in the fraction of a second between the click and
 * the popover finishing its animation.
 */
const Calendar = lazy(() => import("./Calendar"));

export type DatePickerProps = {
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * A button that opens a calendar.
 *
 *     <Field label="Date">
 *       <DatePicker value={date} onValueChange={setDate} />
 *     </Field>
 *
 * Base UI has no calendar, so this is react-day-picker inside our Popover.
 * Its styling lives in DatePicker.module.css - we do NOT import the
 * library's own stylesheet, so every colour still comes from tokens.css.
 */
export function DatePicker({
  value,
  onValueChange,
  placeholder = "Choose a date",
  disabled = false,
  className,
}: DatePickerProps) {
  const label = value
    ? new Intl.DateTimeFormat(LANG, { dateStyle: "long" }).format(value)
    : placeholder;

  return (
    <Popover
      trigger={
        <button
          type="button"
          disabled={disabled}
          className={cx(styles.trigger, !value && styles.empty, className)}
        >
          <CalendarIcon />
          <span>{label}</span>
        </button>
      }
    >
      <Suspense fallback={<Spinner />}>
        <Calendar value={value} onValueChange={onValueChange} />
      </Suspense>
    </Popover>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="16"
      height="16"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 6.5h12M5.5 2v2M10.5 2v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
