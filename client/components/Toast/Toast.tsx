// This file exports the provider and the useToast hook together, so the
// whole toast story is in one place. That trips a hot-reloading rule whose
// only cost is that editing THIS file reloads the page instead of patching
// it - worth it for one file instead of two.
/* eslint-disable react-refresh/only-export-components */
import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { IconButton } from "../IconButton";
import styles from "./Toast.module.css";

/**
 * Short messages that appear in a corner - "Saved", "Delete failed".
 *
 * Two pieces:
 *   1. <ToastProvider> goes once, near the top of client/App.tsx.
 *   2. useToast() is what you call from anywhere to show one.
 *
 *     const toast = useToast();
 *     toast.add({ title: "Event saved" });
 *     toast.add({ title: "Delete failed", type: "error" });
 *
 * Do not use a toast for something the user must act on - it disappears.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <BaseToast.Provider>
      {children}
      <ToastViewport />
    </BaseToast.Provider>
  );
}

/** Show a toast from anywhere inside <ToastProvider>. */
export const useToast = BaseToast.useToastManager;

function ToastViewport() {
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className={styles.viewport}>
        <ToastList />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

function ToastList() {
  const { toasts } = useToast();

  return toasts.map((toast) => (
    <BaseToast.Root
      key={toast.id}
      toast={toast}
      className={cx(
        styles.toast,
        toast.type === "error" && styles.error,
        toast.type === "success" && styles.success,
      )}
    >
      <BaseToast.Content className={styles.content}>
        <BaseToast.Title className={styles.title} />
        <BaseToast.Description className={styles.description} />
      </BaseToast.Content>
      <BaseToast.Close
        render={
          <IconButton label="Close" size="sm">
            <CloseIcon />
          </IconButton>
        }
      />
    </BaseToast.Root>
  ));
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m3 3 6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
