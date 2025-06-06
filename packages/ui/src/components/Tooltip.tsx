/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ITooltip } from 'react-tooltip';
import { Tooltip as TooltipReact } from 'react-tooltip';

import { Box } from '..';

export const Tooltip = ({ variant = 'info', ...props }: ITooltip) => {
  const className = `tooltip-component tooltip-${variant}`;

  const getVariantStyles = (variantType: string) => {
    const variants = {
      info: {
        backgroundColor: 'input.background.secondary.default',
        color: 'feedback.text.secondary.default',
        borderColor: 'feedback.border.secondary.default',
      },
      success: {
        backgroundColor: 'feedback.background.positive.default',
        color: 'feedback.text.positive.default',
        borderColor: 'feedback.border.positive.default',
      },
      warning: {
        backgroundColor: 'feedback.background.caution.default',
        color: 'feedback.text.caution.default',
        borderColor: 'feedback.border.caution.default',
      },
      error: {
        backgroundColor: 'feedback.background.negative.default',
        color: 'feedback.text.negative.default',
        borderColor: 'feedback.border.negative.default',
      },
    };

    return variants[variantType as keyof typeof variants] || variants.info;
  };

  return (
    <Box
      sx={({ fonts }) => {
        const variantStyles = getVariantStyles(variant);
        /**
         * https://react-tooltip.com/docs/examples/styling#classes
         */
        return {
          '.example-arrow': {
            display: 'none',
          },
          '.tooltip-component': {
            fontFamily: (fonts as any)?.body,
            paddingY: '2',
            paddingX: '3',
            border: 'sm',
            borderRadius: 'xl',
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
            ...variantStyles,
          },
          [`&.tooltip-${variant}`]: variantStyles,
        };
      }}
    >
      <TooltipReact
        className={className}
        {...props}
        classNameArrow="example-arrow"
      >
        {props.children}
      </TooltipReact>
    </Box>
  );
};
