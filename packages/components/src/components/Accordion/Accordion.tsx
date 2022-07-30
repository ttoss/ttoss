/** @jsxImportSource theme-ui */

import {
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  Accordion as ReactAccessibleAccordion,
} from 'react-accessible-accordion';
import { Box, BoxProps } from '@ttoss/ui';

export type AccordionProps = BoxProps & {
  // https://github.com/springload/react-accessible-accordion#accordion
  allowMultipleExpanded?: boolean;
  allowZeroExpanded?: boolean;
  preExpanded?: string[];
  /**
   * Callback which is invoked when items are expanded or collapsed. Gets passed uuids of the currently expanded AccordionItems.
   */
  onChange?: (args: string[]) => void;
};

export const Accordion = ({
  children,
  allowMultipleExpanded,
  allowZeroExpanded,
  preExpanded,
  onChange,
  ...boxProps
}: AccordionProps) => {
  return (
    <Box
      {...boxProps}
      sx={{
        '.accordion__item': {
          marginBottom: 3,
        },
        '.accordion__heading': {
          padding: 2,
          border: '1px solid',
          borderColor: 'black',
        },
        '.accordion__button': {},
        '.accordion__panel': {
          padding: 2,
        },
        ...boxProps.sx,
      }}
    >
      <ReactAccessibleAccordion
        {...{
          allowMultipleExpanded,
          allowZeroExpanded,
          preExpanded,
          onChange,
        }}
      >
        {children}
      </ReactAccessibleAccordion>
    </Box>
  );
};

Accordion.Item = AccordionItem;
Accordion.ItemButton = AccordionItemButton;
Accordion.ItemHeading = AccordionItemHeading;
Accordion.ItemPanel = AccordionItemPanel;
