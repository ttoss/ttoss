import {
  type TabContentProps,
  type TabListProps,
  Tabs as ArkTabs,
  type TabsRootProps,
  type TabTriggerProps,
} from '@ark-ui/react/tabs';
import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Accessible tabs component built on Ark UI.
 *
 * Responsibility: **Navigation** — movement across views.
 *
 * @example
 * ```tsx
 * <Tabs.Root defaultValue="tab1">
 *   <Tabs.List>
 *     <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
 *     <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="tab1">Content 1</Tabs.Content>
 *   <Tabs.Content value="tab2">Content 2</Tabs.Content>
 * </Tabs.Root>
 * ```
 */

const TabsRoot = React.forwardRef<HTMLDivElement, TabsRootProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkTabs.Root
        ref={ref}
        className={cn('ui2-tabs', className)}
        {...props}
      />
    );
  }
);
TabsRoot.displayName = 'Tabs.Root';

const TabsList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkTabs.List
        ref={ref}
        className={cn('ui2-tabs__list', className)}
        {...props}
      />
    );
  }
);
TabsList.displayName = 'Tabs.List';

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkTabs.Trigger
        ref={ref}
        className={cn('ui2-tabs__trigger', className)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'Tabs.Trigger';

const TabsContent = React.forwardRef<HTMLDivElement, TabContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkTabs.Content
        ref={ref}
        className={cn('ui2-tabs__content', className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'Tabs.Content';

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};
