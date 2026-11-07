import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps, ReactNode } from "react";
import { cx, type PlainClassName } from "../../lib/cx";
import styles from "./Tabs.module.css";

export type TabsProps = PlainClassName<ComponentProps<typeof BaseTabs.Root>> & {
  children: ReactNode;
};

/**
 * Switch between panels of content.
 *
 *     <Tabs defaultValue="details">
 *       <Tabs.List>
 *         <Tabs.Tab value="details">Details</Tabs.Tab>
 *         <Tabs.Tab value="people">People</Tabs.Tab>
 *       </Tabs.List>
 *       <Tabs.Panel value="details">...</Tabs.Panel>
 *       <Tabs.Panel value="people">...</Tabs.Panel>
 *     </Tabs>
 */
export function Tabs({ className, ...props }: TabsProps) {
  return <BaseTabs.Root className={cx(styles.root, className)} {...props} />;
}

function List({
  className,
  children,
  ...props
}: PlainClassName<ComponentProps<typeof BaseTabs.List>>) {
  return (
    <BaseTabs.List className={cx(styles.list, className)} {...props}>
      {children}
      {/* A bar that slides under the selected tab. Base UI positions it. */}
      <BaseTabs.Indicator className={styles.indicator} />
    </BaseTabs.List>
  );
}

function Tab({
  className,
  ...props
}: PlainClassName<ComponentProps<typeof BaseTabs.Tab>>) {
  return <BaseTabs.Tab className={cx(styles.tab, className)} {...props} />;
}

function Panel({
  className,
  ...props
}: PlainClassName<ComponentProps<typeof BaseTabs.Panel>>) {
  return <BaseTabs.Panel className={cx(styles.panel, className)} {...props} />;
}

Tabs.List = List;
Tabs.Tab = Tab;
Tabs.Panel = Panel;
