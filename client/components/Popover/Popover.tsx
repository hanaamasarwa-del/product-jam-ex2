import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Popover.module.css";

export type PopoverProps = PlainClassName<
  Omit<ComponentProps<typeof BasePopover.Root>, "children">
> & {
  trigger: ReactElement;
  title?: ReactNode;
  children: ReactNode;
  /** Which side of the trigger it appears on. */
  side?: "top" | "bottom" | "inline-start" | "inline-end";
};

/**
 * A small panel anchored to whatever opened it. Use it for extra detail or
 * a compact form; use Dialog when the task deserves the whole screen.
 *
 * Note the RTL-safe sides: "inline-start" is left in English and right in
 * Hebrew, so the panel always opens on the correct side.
 */
export function Popover({
  trigger,
  title,
  children,
  side = "bottom",
  className,
  ...props
}: PopoverProps) {
  return (
    <BasePopover.Root {...props}>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner
          side={side}
          sideOffset={6}
          className={styles.positioner}
        >
          <BasePopover.Popup className={cx(styles.popup, className)}>
            {title ? (
              <BasePopover.Title className={styles.title}>
                {title}
              </BasePopover.Title>
            ) : null}
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

Popover.Close = BasePopover.Close;
