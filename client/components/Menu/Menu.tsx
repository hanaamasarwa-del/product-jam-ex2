import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Menu.module.css";

export type MenuProps = PlainClassName<
  Omit<ComponentProps<typeof BaseMenu.Root>, "children">
> & {
  trigger: ReactElement;
  /** Use <Menu.Item> and <Menu.Separator> inside. */
  children: ReactNode;
};

/**
 * A list of actions that drops down from a button.
 *
 *     <Menu trigger={<Button variant="secondary">Actions</Button>}>
 *       <Menu.Item onClick={edit}>Edit</Menu.Item>
 *       <Menu.Separator />
 *       <Menu.Item onClick={remove}>Delete</Menu.Item>
 *     </Menu>
 *
 * Arrow keys move between items, Escape closes, and typing jumps to an
 * item - all handled by Base UI.
 */
export function Menu({ trigger, children, className, ...props }: MenuProps) {
  return (
    <BaseMenu.Root {...props}>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          sideOffset={4}
          align="start"
          className={styles.positioner}
        >
          <BaseMenu.Popup className={cx(styles.popup, className)}>
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export type MenuItemProps = PlainClassName<
  ComponentProps<typeof BaseMenu.Item>
> & {
  /** Styles it as a destructive action. */
  destructive?: boolean;
};

function Item({ destructive, className, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cx(styles.item, destructive && styles.destructive, className)}
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: PlainClassName<ComponentProps<typeof BaseMenu.Separator>>) {
  return (
    <BaseMenu.Separator
      className={cx(styles.separator, className)}
      {...props}
    />
  );
}

Menu.Item = Item;
Menu.Separator = MenuSeparator;
