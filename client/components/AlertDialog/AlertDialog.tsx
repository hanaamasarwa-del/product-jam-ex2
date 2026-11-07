import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Button } from "../Button";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./AlertDialog.module.css";

export type AlertDialogProps = PlainClassName<
  Omit<ComponentProps<typeof BaseAlertDialog.Root>, "children">
> & {
  /** The element the user clicks to open it - a single element. */
  trigger?: ReactElement;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Runs when the user confirms. */
  onConfirm: () => void;
  /** Makes the confirm button red. Use for deleting things. */
  destructive?: boolean;
};

/**
 * "Are you sure?" - for actions you cannot undo.
 *
 * Unlike Dialog, clicking outside it does nothing - the user has to pick
 * one of the two buttons. Escape still closes it, and that is on purpose:
 * a keyboard user must always have a way out of a modal.
 *
 *     <AlertDialog
 *       trigger={<Button variant="danger">Delete</Button>}
 *       title="Delete the event?"
 *       description="This cannot be undone."
 *       confirmLabel="Delete"
 *       destructive
 *       onConfirm={() => deleteEvent.mutate(id)}
 *     />
 */
export function AlertDialog({
  trigger,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
  className,
  ...props
}: AlertDialogProps) {
  return (
    <BaseAlertDialog.Root {...props}>
      {trigger ? <BaseAlertDialog.Trigger render={trigger} /> : null}
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className={styles.backdrop} />
        <BaseAlertDialog.Popup className={cx(styles.popup, className)}>
          <BaseAlertDialog.Title className={styles.title}>
            {title}
          </BaseAlertDialog.Title>
          <BaseAlertDialog.Description className={styles.description}>
            {description}
          </BaseAlertDialog.Description>
          <div className={styles.footer}>
            <BaseAlertDialog.Close
              render={<Button variant="secondary">{cancelLabel}</Button>}
            />
            <BaseAlertDialog.Close
              onClick={onConfirm}
              render={
                <Button variant={destructive ? "danger" : "primary"}>
                  {confirmLabel}
                </Button>
              }
            />
          </div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
}
