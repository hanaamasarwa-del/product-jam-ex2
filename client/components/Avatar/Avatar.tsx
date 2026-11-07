import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cx } from "../../lib/cx";
import styles from "./Avatar.module.css";

export type AvatarProps = {
  /** Picture to show. If it fails to load, the initials show instead. */
  src?: string | null;
  /** Describes the person, for screen readers. */
  alt: string;
  /** Shown when there is no picture. Defaults to the first letter of `alt`. */
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * A round picture of a person, falling back to their initials.
 *
 *     <Avatar src={user.avatar_url} alt={user.email} />
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const initials = fallback ?? alt.trim().charAt(0).toUpperCase();

  return (
    <BaseAvatar.Root className={cx(styles.root, styles[size], className)}>
      {src ? (
        <BaseAvatar.Image src={src} alt={alt} className={styles.image} />
      ) : null}
      <BaseAvatar.Fallback className={styles.fallback}>
        {initials}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
