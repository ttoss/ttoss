import { Icon } from '@ttoss/react-icons';
import * as React from 'react';
import { Label as LabelUi, type LabelProps as LabelPropsUi } from 'theme-ui';

import { Text } from '..';
import { Tooltip } from '..';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: string | React.ReactNode;
  tooltipClickable?: boolean;
};

export const Label = ({
  children,
  tooltip,
  tooltipClickable,
  sx,
  ...props
}: LabelProps) => {
  return (
    <LabelUi
      sx={{
        alignItems: 'center',
        fontSize: 'sm',
        lineHeight: 'normal',
        ...sx,
      }}
      {...props}
    >
      {children}

      {tooltip && (
        <Text
          sx={{
            color: 'currentcolor',
            cursor: 'pointer',
          }}
          className={'anchor-element'}
          aria-label={TOOLTIP_LABEL}
        >
          <Icon inline icon="info" />
          <Tooltip
            anchorSelect={'.anchor-element'}
            clickable={tooltipClickable ? true : false}
            place="right"
            className="tooltip-component"
          >
            {typeof tooltip === 'string' && (
              <Text sx={{ color: 'white' }}>{tooltip}</Text>
            )}
            {React.isValidElement(tooltip) && tooltip}
          </Tooltip>
        </Text>
      )}
    </LabelUi>
  );
};
