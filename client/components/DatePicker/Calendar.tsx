import { DayPicker } from "react-day-picker";
import { ar, enUS, he } from "react-day-picker/locale";
import { DIRECTION, LANG } from "../../lib/config";
import styles from "./DatePicker.module.css";

const LOCALES = { he, ar, en: enUS };

/**
 * The calendar grid itself.
 *
 * This lives in its own file because DatePicker.tsx loads it lazily - see
 * the comment there. Keeping it separate is what lets the calendar library
 * stay out of the main download.
 */
export default function Calendar({
  value,
  onValueChange,
}: {
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
}) {
  const locale = LOCALES[LANG as keyof typeof LOCALES] ?? enUS;

  return (
    <DayPicker
      mode="single"
      selected={value}
      onSelect={onValueChange}
      locale={locale}
      dir={DIRECTION}
      showOutsideDays
      // Map every part of the calendar onto our own classes, so none of the
      // library's default styling applies and everything comes from tokens.
      classNames={{
        root: styles.calendar,
        months: styles.months,
        month: styles.month,
        month_caption: styles.caption,
        caption_label: styles.captionLabel,
        nav: styles.nav,
        button_previous: styles.navButton,
        button_next: styles.navButton,
        chevron: styles.chevron,
        month_grid: styles.grid,
        weekdays: styles.weekdays,
        weekday: styles.weekday,
        week: styles.week,
        day: styles.day,
        day_button: styles.dayButton,
        today: styles.today,
        selected: styles.selected,
        outside: styles.outside,
        disabled: styles.disabledDay,
        hidden: styles.hidden,
      }}
    />
  );
}
