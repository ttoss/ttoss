import {
  Accordion as ArkAccordion,
  type AccordionItemContentProps,
  type AccordionItemProps,
  type AccordionItemTriggerProps,
  type AccordionRootProps,
} from '@ark-ui/react/accordion';
import * as React from 'react';

import { cn } from '../../_shared/cn';
import { ChevronDownIcon } from '../../_shared/icons';

/**
 * Accessible accordion component built on Ark UI.
 *
 * Responsibility: **Disclosure** — revealing or hiding related content in place.
 *
 * @example
 * ```tsx
 * <Accordion.Root collapsible>
 *   <Accordion.Item value="item-1">
 *     <Accordion.Trigger>Section 1</Accordion.Trigger>
 *     <Accordion.Content>Content for section 1</Accordion.Content>
 *   </Accordion.Item>
 *   <Accordion.Item value="item-2">
 *     <Accordion.Trigger>Section 2</Accordion.Trigger>
 *     <Accordion.Content>Content for section 2</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion.Root>
 * ```
 */

const AccordionRoot = React.forwardRef<HTMLDivElement, AccordionRootProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkAccordion.Root
        ref={ref}
        className={cn('ui2-accordion', className)}
        {...props}
      />
    );
  }
);
AccordionRoot.displayName = 'Accordion.Root';

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkAccordion.Item
        ref={ref}
        className={cn('ui2-accordion__item', className)}
        {...props}
      />
    );
  }
);
AccordionItem.displayName = 'Accordion.Item';

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionItemTriggerProps
>(({ className, children, ...props }, ref) => {
  return (
    <ArkAccordion.ItemTrigger
      ref={ref}
      className={cn('ui2-accordion__trigger', className)}
      {...props}
    >
      {children}
      <ArkAccordion.ItemIndicator className="ui2-accordion__indicator">
        <ChevronDownIcon />
      </ArkAccordion.ItemIndicator>
    </ArkAccordion.ItemTrigger>
  );
});
AccordionTrigger.displayName = 'Accordion.Trigger';

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionItemContentProps
>(({ className, children, ...props }, ref) => {
  return (
    <ArkAccordion.ItemContent
      ref={ref}
      className={cn('ui2-accordion__content', className)}
      {...props}
    >
      <div className="ui2-accordion__content-inner">{children}</div>
    </ArkAccordion.ItemContent>
  );
});
AccordionContent.displayName = 'Accordion.Content';

export const Accordion = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
};
