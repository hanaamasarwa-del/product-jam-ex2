import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Dialog.module.css";

export type DialogProps = PlainClassName<
  Omit<ComponentProps<typeof BaseDialog.Root>, "children">
> & {
  /**
   * The element the user clicks to open it - a single element, e.g.
   * `<Button>Open</Button>`. Base UI clones it and attaches the
   * open/close behaviour, rather than wrapping it in another button.
   */
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons along the bottom. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

/**
 * A window that opens on top of the page for a side task.
 *
 *     <Dialog trigger={<Button>Edit</Button>} title="Edit event"
 *             footer={<Dialog.Close render={<Button>Close</Button>} />}>
 *       <EventForm ... />
 *     </Dialog>
 *
 * Base UI handles the hard parts: focus moves into the dialog and is trapped
 * there, Escape closes it, and the page behind is hidden from screen readers.
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  ...props
}: DialogProps) {
  return (
    <BaseDialog.Root {...props}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={cx(styles.popup, styles[size], className)}>
          <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>
          {description ? (
            <BaseDialog.Description className={styles.description}>
              {description}
            </BaseDialog.Description>
          ) : null}
          <div className={styles.body}>{children}</div>
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

Dialog.Close = BaseDialog.Close;
