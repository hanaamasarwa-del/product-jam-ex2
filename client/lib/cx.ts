/**
 * Joins class names, ignoring anything falsy.
 *
 *     cx(styles.button, styles[variant], disabled && styles.disabled)
 *
 * That is all it does. Components take a `className` prop and pass it last,
 * so whoever uses a component can always add to its styling.
 */
export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Base UI allows `className` to be a function that receives the component's
 * current state. That is powerful, but our components do not need it, and a
 * plain string is far easier to read and to pass around. This narrows a Base
 * UI component's props so `className` is just a string.
 *
 * We style states with CSS instead - see any .module.css in this folder for
 * selectors like `[data-open]` or `[data-disabled]`.
 */
export type PlainClassName<T> = Omit<T, "className"> & { className?: string };
