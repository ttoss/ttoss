import { Icon } from '@ttoss/react-icons';
import * as React from 'react';
import { Label as LabelUi, type LabelProps as LabelPropsUi } from 'theme-ui';

import { Text } from './Text';
import { Tooltip, type TooltipProps } from './Tooltip';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: TooltipProps;
};

export const Label = ({ children, tooltip, sx, ...props }: LabelProps) => {
  const id = React.useId();

  const tooltipId = `${id}-tooltip`;

  return (
    <LabelUi
      sx={{
        alignItems: 'center',
        fontSize: 'sm',
        lineHeight: 'normal',
        width: 'fit-content',
        color: 'input.text.secondary.default',
        ...sx,
      }}
      {...props}
    >
      {children}
      {tooltip && (
        <Text
          data-tooltip-id={tooltipId}
          sx={{
            color: 'currentcolor',
            cursor: 'pointer',
            marginLeft: '1',
          }}
          aria-label={TOOLTIP_LABEL}
        >
          <Icon icon="info" />
          <Tooltip {...tooltip} id={tooltipId} />
        </Text>
      )}
    </LabelUi>
  );
};
