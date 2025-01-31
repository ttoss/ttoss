/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ITooltip } from 'react-tooltip';
import { Tooltip as TooltipReact } from 'react-tooltip';

import { Box } from '..';

export const Tooltip = (props: ITooltip) => {
  const className = 'tooltip-component';

  return (
    <Box
      sx={({ colors, fonts }) => {
        const themeColors = colors as Record<string, any>;

        /**
         * https://react-tooltip.com/docs/examples/styling#classes
         */
        return {
          '.tooltip-component': {
            fontFamily: (fonts as any)?.body,
            backgroundColor:
              themeColors?.feedback?.background?.primary?.default,
            paddingY: '2',
            paddingX: '3',
            color: themeColors?.feedback?.text?.secondary?.default,
            border: 'sm',
            borderRadius: 'xl',
            borderColor: themeColors?.feedback?.border?.primary?.default,
            zIndex: 'tooltip',
            opacity: '1',
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
