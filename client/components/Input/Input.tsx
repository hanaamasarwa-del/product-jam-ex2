import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Input.module.css";

// The native `size` attribute on <input> means "how many characters wide",
// which nobody uses. We drop it and reuse the name for our visual size, so
// Input matches Button.
export type InputProps = PlainClassName<
  Omit<ComponentProps<typeof BaseInput>, "size">
> & {
  size?: "sm" | "md";
};

/**
 * A single-line text box. Put it inside a <Field> so it gets a label.
 *
 *     <Field label="Email">
 *       <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
 *     </Field>
 */
export function Input({ size = "md", className, ...props }: InputProps) {
  return (
    <BaseInput
      className={cx(styles.input, styles[size], className)}
      {...props}
    />
  );
}
