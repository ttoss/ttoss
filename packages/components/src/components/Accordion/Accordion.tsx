import type { BoxProps } from '@ttoss/ui';
import { Box, Button } from '@ttoss/ui';
import * as React from 'react';

/**
 * Individual item for the Accordion component.
 */
export type AccordionItem = {
  /**
   * Unique identifier for the accordion item.
   * If not provided, will use the index as the key.
   */
  id?: string;
  /**
   * Title displayed in the accordion header.
   */
  title: React.ReactNode;
  /**
   * Content displayed when the accordion item is expanded.
   */
  content: React.ReactNode;
  /**
   * Whether the item is disabled.
   * @default false
   */
  disabled?: boolean;
};

/**
 * Render props for custom accordion item rendering.
 */
export type AccordionRenderItemProps = {
  /**
   * The accordion item data.
   */
  item: AccordionItem;
  /**
   * Index of the item in the items array.
   */
  index: number;
  /**
   * Whether the item is currently expanded.
   */
  isExpanded: boolean;
  /**
   * Function to toggle the item's expanded state.
   */
  toggle: () => void;
  /**
   * Generated IDs for accessibility.
   */
  ids: {
    itemId: string;
    headingId: string;
    panelId: string;
  };
};

/**
 * Props for the Accordion component.
 */
export type AccordionProps = BoxProps & {
  /**
   * Array of accordion items to render.
   */
  items: AccordionItem[];
  /**
   * Whether multiple items can be expanded at once.
   * @default false
   */
  multiple?: boolean;
  /**
   * Index or array of indices for initially expanded items.
   */
  defaultExpanded?: number | number[];
  /**
   * Callback invoked when items are expanded or collapsed.
   * Receives array of currently expanded indices.
   */
  onAccordionChange?: (expandedIndices: number[]) => void;
  /**
   * Custom render function for accordion items.
   * Provides full control over item rendering while maintaining accessibility.
   */
  renderItem?: (props: AccordionRenderItemProps) => React.ReactNode;
};

/**
 * Accessible accordion component with collapsible content sections.
 *
 * This component provides a simplified API for creating expandable/collapsible
 * content sections. It uses design tokens from @ttoss/theme for consistent styling
 * and follows WAI-ARIA accordion pattern for accessibility.
 *
 * @example
 * ```tsx
 * <Accordion
 *   items={[
 *     {
 *       title: 'Section 1',
 *       content: 'Content for section 1',
 *     },
 *     {
 *       title: 'Section 2',
 *       content: 'Content for section 2',
 *     },
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <Accordion
 *   multiple
 *   defaultExpanded={[0, 1]}
 *   items={[
 *     {
 *       id: 'item-1',
 *       title: 'Pre-expanded Section 1',
 *       content: <div>Rich content</div>,
 *     },
 *     {
 *       id: 'item-2',
 *       title: 'Pre-expanded Section 2',
 *       content: <p>More content</p>,
 *     },
 *   ]}
 *   onAccordionChange={(expanded) => console.log('Expanded items:', expanded)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Custom rendering with renderItem
 * <Accordion
 *   items={items}
 *   renderItem={({ item, isExpanded, toggle, ids }) => (
 *     <CustomAccordionItem
 *       item={item}
 *       isExpanded={isExpanded}
 *       onToggle={toggle}
 *       headingId={ids.headingId}
 *       panelId={ids.panelId}
 *     />
 *   )}
 * />
 * ```
 */
export const Accordion = ({
  items,
  multiple = false,
  defaultExpanded,
  onAccordionChange,
  renderItem,
  sx,
  ...boxProps
}: AccordionProps) => {
  const [expandedIndices, setExpandedIndices] = React.useState<number[]>(() => {
    if (defaultExpanded === undefined) {
      return [];
    }
    return Array.isArray(defaultExpanded) ? defaultExpanded : [defaultExpanded];
  });

  const toggleItem = React.useCallback(
    (index: number) => {
      setExpandedIndices((prev) => {
        const isExpanded = prev.includes(index);
        let newExpanded: number[];

        if (isExpanded) {
          newExpanded = prev.filter((i) => {
            return i !== index;
          });
        } else {
          newExpanded = multiple ? [...prev, index] : [index];
        }

        onAccordionChange?.(newExpanded);
        return newExpanded;
      });
    },
    [multiple, onAccordionChange]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
      {...boxProps}
    >
      {items.map((item, index) => {
        const isExpanded = expandedIndices.includes(index);
        const itemId = item.id || `accordion-item-${index}`;
        const headingId = `${itemId}-heading`;
        const panelId = `${itemId}-panel`;

        // Custom rendering if renderItem is provided
        if (renderItem) {
          return (
            <React.Fragment key={itemId}>
              {renderItem({
                item,
                index,
                isExpanded,
                toggle: () => {
                  return toggleItem(index);
                },
                ids: { itemId, headingId, panelId },
              })}
            </React.Fragment>
          );
        }

        // Default rendering
        return (
          <Box
            key={itemId}
            sx={{
              border: 'sm',
              borderColor: 'display.border.muted.default',
              borderRadius: 'md',
              overflow: 'hidden',
            }}
          >
            <Button
              id={headingId}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                toggleItem(index);
              }}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              rightIcon={isExpanded ? 'chevron-up' : 'chevron-down'}
              sx={{
                width: '100%',
                justifyContent: 'space-between',
                backgroundColor: isExpanded
                  ? 'display.background.muted.default'
                  : 'display.background.primary.default',
                color: item.disabled
                  ? 'display.text.muted.default'
                  : 'display.text.primary.default',
                fontWeight: 500,
                border: 'none',
                borderRadius: 0,
                transition: 'background-color 0.2s ease',
                '&:hover:not(:disabled)': {
                  backgroundColor: 'display.background.muted.default',
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: (theme) => {
                    return `inset 0 0 0 1px ${
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (theme.colors as any)?.input?.border?.accent?.default ||
                      'currentColor'
                    }`;
                  },
                },
              }}
            >
              {item.title}
            </Button>

            {isExpanded && (
              <Box
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                sx={{
                  padding: 4,
                  borderTop: 'sm',
                  borderColor: 'display.border.muted.default',
                  backgroundColor: 'display.background.primary.default',
                }}
              >
                {item.content}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
