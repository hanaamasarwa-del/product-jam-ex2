import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Tooltip.module.css";

export type TooltipProps = PlainClassName<
  Omit<ComponentProps<typeof BaseTooltip.Root>, "children">
> & {
  /** The element the tip describes. */
  children: ReactElement;
  /** The tip itself. Keep it short. */
  content: ReactNode;
  side?: "top" | "bottom" | "inline-start" | "inline-end";
};

/**
 * A short hint shown on hover or keyboard focus.
 *
 *     <Tooltip content="Deletes permanently">
 *       <IconButton label="Delete"><TrashIcon /></IconButton>
 *     </Tooltip>
 *
 * A tooltip is NOT a substitute for a label - touch users never see it.
 * Always give icon buttons a real `label` too.
 */
export function Tooltip({
  children,
  content,
  side = "top",
  className,
  ...props
}: TooltipProps) {
  return (
    <BaseTooltip.Root {...props}>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          side={side}
          sideOffset={6}
          className={styles.positioner}
        >
          <BaseTooltip.Popup className={cx(styles.popup, className)}>
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/**
 * Put this once near the top of the app. It lets a second tooltip appear
 * instantly while the user is already reading one.
 */
export const TooltipProvider = BaseTooltip.Provider;
