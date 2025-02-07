/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ITooltip } from 'react-tooltip';
import { Tooltip as TooltipReact } from 'react-tooltip';

import { Box } from '..';

export const Tooltip = (props: ITooltip) => {
  const className = 'tooltip-component';

  return (
    <Box
      sx={({ fonts }) => {
        /**
         * https://react-tooltip.com/docs/examples/styling#classes
         */
        return {
          '.tooltip-component': {
            fontFamily: (fonts as any)?.body,
            backgroundColor: 'input.background.secondary.default',
            paddingY: '2',
            paddingX: '3',
            color: 'feedback.text.secondary.default',
            border: 'sm',
            borderRadius: 'xl',
            borderColor: 'feedback.border.secondary.default',
            zIndex: 'tooltip',
            opacity: '1',
            lineHeight: 'shorter',
            letterSpacing: 'wide',
            a: {
              color: 'feedback.text.secondary.default',
              fontFamily: 'body',
              textDecorationLine: 'underline',
              lineHeight: 'normal',
            },
          },
        };
      }}
    >
      <TooltipReact className={className} {...props}>
        {props.children}
      </TooltipReact>
    </Box>
  );
};
