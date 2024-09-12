import * as React from 'react';
import {
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
  Accordion as ReactAccessibleAccordion,
} from 'react-accessible-accordion';
import { Box, BoxProps, useTheme } from '@ttoss/ui';
import { css as createClassName } from '@emotion/css';
import { css as transformStyleObject } from '@theme-ui/css';

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
  const { theme } = useTheme();

  const className = React.useMemo(() => {
    const styles = transformStyleObject({
      '.accordion__item': {
        marginBottom: 3,
      },
      '.accordion__heading': {
        padding: 'md',
        border: '1px solid',
        borderColor: 'black',
      },
      '.accordion__button': {},
      '.accordion__panel': {
        padding: 2,
      },
    })(theme);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createClassName(styles as any);
  }, [theme]);

  return (
    <Box variant="accordion" className={className} {...boxProps}>
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

export {
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
};
