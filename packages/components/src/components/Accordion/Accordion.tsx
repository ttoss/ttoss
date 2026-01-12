import type { BoxProps } from '@ttoss/ui';
import { Box } from '@ttoss/ui';
import * as React from 'react';

type AccordionContextValue = {
  expandedItems: string[];
  toggleItem: (uuid: string) => void;
  allowMultipleExpanded: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null
);

const useAccordionContext = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error(
      'Accordion components must be used within an Accordion component'
    );
  }
  return context;
};

/**
 * Props for the Accordion component.
 */
export type AccordionProps = BoxProps & {
  /**
   * Whether multiple items can be expanded at once.
   * @default false
   */
  allowMultipleExpanded?: boolean;
  /**
   * Whether all items can be collapsed (none expanded).
   * @default false
   */
  allowZeroExpanded?: boolean;
  /**
   * Array of item UUIDs that should be expanded initially.
   */
  preExpanded?: string[];
  /**
   * Callback invoked when items are expanded or collapsed.
   * Receives array of currently expanded item UUIDs.
   */
  onExpandedChange?: (expandedUuids: string[]) => void;
};

/**
 * Accessible accordion component with collapsible content sections.
 *
 * This component provides an expandable/collapsible interface for organizing
 * content into sections. It supports single or multiple expanded sections,
 * keyboard navigation, and follows WAI-ARIA accordion pattern for accessibility.
 *
 * @example
 * ```tsx
 * <Accordion>
 *   <AccordionItem>
 *     <AccordionItemHeading>
 *       <AccordionItemButton>Section 1</AccordionItemButton>
 *     </AccordionItemHeading>
 *     <AccordionItemPanel>
 *       Content for section 1
 *     </AccordionItemPanel>
 *   </AccordionItem>
 * </Accordion>
 * ```
 *
 * @example
 * ```tsx
 * <Accordion allowMultipleExpanded preExpanded={['item-1']}>
 *   <AccordionItem uuid="item-1">
 *     <AccordionItemHeading>
 *       <AccordionItemButton>Pre-expanded Section</AccordionItemButton>
 *     </AccordionItemHeading>
 *     <AccordionItemPanel>
 *       This section is expanded by default
 *     </AccordionItemPanel>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion = ({
  children,
  allowMultipleExpanded = false,
  allowZeroExpanded = false,
  preExpanded = [],
  onExpandedChange,
  ...boxProps
}: AccordionProps) => {
  const [expandedItems, setExpandedItems] =
    React.useState<string[]>(preExpanded);

  const toggleItem = React.useCallback(
    (uuid: string) => {
      setExpandedItems((prev) => {
        const isExpanded = prev.includes(uuid);
        let newExpanded: string[];

        if (isExpanded) {
          // Collapsing
          if (!allowZeroExpanded && prev.length === 1) {
            // Don't collapse if it's the last expanded item and allowZeroExpanded is false
            return prev;
          }
          newExpanded = prev.filter((id) => {
            return id !== uuid;
          });
        } else {
          // Expanding
          if (allowMultipleExpanded) {
            newExpanded = [...prev, uuid];
          } else {
            newExpanded = [uuid];
          }
        }

        onExpandedChange?.(newExpanded);
        return newExpanded;
      });
    },
    [allowMultipleExpanded, allowZeroExpanded, onExpandedChange]
  );

  return (
    <AccordionContext.Provider
      value={{ expandedItems, toggleItem, allowMultipleExpanded }}
    >
      <Box variant="accordion" {...boxProps}>
        {children}
      </Box>
    </AccordionContext.Provider>
  );
};

type AccordionItemContextValue = {
  uuid: string;
  isExpanded: boolean;
  headingId: string;
  panelId: string;
};

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null);

const useAccordionItemContext = () => {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      'AccordionItem sub-components must be used within an AccordionItem'
    );
  }
  return context;
};

/**
 * Props for the AccordionItem component.
 */
export type AccordionItemProps = {
  /**
   * Unique identifier for the accordion item.
   * If not provided, a random UUID will be generated.
   */
  uuid?: string;
  /**
   * Child components (typically AccordionItemHeading and AccordionItemPanel).
   */
  children: React.ReactNode;
  /**
   * Optional className for styling.
   */
  className?: string;
};

/**
 * Individual item within an Accordion.
 *
 * Each AccordionItem should contain an AccordionItemHeading and AccordionItemPanel.
 *
 * @example
 * ```tsx
 * <AccordionItem uuid="unique-id">
 *   <AccordionItemHeading>
 *     <AccordionItemButton>Title</AccordionItemButton>
 *   </AccordionItemHeading>
 *   <AccordionItemPanel>Content</AccordionItemPanel>
 * </AccordionItem>
 * ```
 */
export const AccordionItem = ({
  uuid: providedUuid,
  children,
  className,
}: AccordionItemProps) => {
  const { expandedItems } = useAccordionContext();
  const generatedId = React.useId();
  const uuid = providedUuid || generatedId;

  const isExpanded = expandedItems.includes(uuid);
  const headingId = `accordion-heading-${uuid}`;
  const panelId = `accordion-panel-${uuid}`;

  return (
    <AccordionItemContext.Provider
      value={{ uuid, isExpanded, headingId, panelId }}
    >
      <Box
        className={className}
        sx={{
          marginBottom: 3,
        }}
      >
        {children}
      </Box>
    </AccordionItemContext.Provider>
  );
};

/**
 * Props for the AccordionItemHeading component.
 */
export type AccordionItemHeadingProps = {
  /**
   * Child component (typically AccordionItemButton).
   */
  children: React.ReactNode;
  /**
   * Optional className for styling.
   */
  className?: string;
};

/**
 * Heading wrapper for an accordion item.
 *
 * Should contain an AccordionItemButton as its child.
 *
 * @example
 * ```tsx
 * <AccordionItemHeading>
 *   <AccordionItemButton>Click to expand</AccordionItemButton>
 * </AccordionItemHeading>
 * ```
 */
export const AccordionItemHeading = ({
  children,
  className,
}: AccordionItemHeadingProps) => {
  const { headingId } = useAccordionItemContext();

  return (
    <Box
      id={headingId}
      className={className}
      role="heading"
      aria-level={3}
      sx={{
        padding: 'md',
        border: '1px solid',
        borderColor: 'black',
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Props for the AccordionItemButton component.
 */
export type AccordionItemButtonProps = {
  /**
   * Content to display in the button (typically text or elements).
   */
  children: React.ReactNode;
  /**
   * Optional className for styling.
   */
  className?: string;
};

/**
 * Button that toggles the expansion state of an accordion item.
 *
 * This is the clickable element within AccordionItemHeading that
 * expands or collapses the associated AccordionItemPanel.
 *
 * @example
 * ```tsx
 * <AccordionItemButton>
 *   Click to toggle content
 * </AccordionItemButton>
 * ```
 */
export const AccordionItemButton = ({
  children,
  className,
}: AccordionItemButtonProps) => {
  const { toggleItem } = useAccordionContext();
  const { uuid, isExpanded, panelId, headingId } = useAccordionItemContext();

  return (
    <Box
      as="button"
      className={className}
      onClick={() => {
        return toggleItem(uuid);
      }}
      aria-expanded={isExpanded}
      aria-controls={panelId}
      id={`${headingId}-button`}
      sx={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        '&:hover': {
          opacity: 0.8,
        },
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Props for the AccordionItemPanel component.
 */
export type AccordionItemPanelProps = {
  /**
   * Content to display in the panel when expanded.
   */
  children: React.ReactNode;
  /**
   * Optional className for styling.
   */
  className?: string;
};

/**
 * Content panel of an accordion item that can be expanded or collapsed.
 *
 * This component contains the content that is shown/hidden when the
 * AccordionItemButton is clicked.
 *
 * @example
 * ```tsx
 * <AccordionItemPanel>
 *   <p>This content is shown when the accordion item is expanded.</p>
 * </AccordionItemPanel>
 * ```
 */
export const AccordionItemPanel = ({
  children,
  className,
}: AccordionItemPanelProps) => {
  const { isExpanded, panelId, headingId } = useAccordionItemContext();

  if (!isExpanded) {
    return null;
  }

  return (
    <Box
      id={panelId}
      className={className}
      role="region"
      aria-labelledby={headingId}
      sx={{
        padding: 2,
      }}
    >
      {children}
    </Box>
  );
};
