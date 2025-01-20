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
            backgroundColor: themeColors?.feedback?.background?.muted?.default,
            color: themeColors?.feedback?.text?.secondary?.default,
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
