import { Icon } from '@ttoss/react-icons';
import * as React from 'react';
import { Label as LabelUi, type LabelProps as LabelPropsUi } from 'theme-ui';

import { Text } from '..';
import { Tooltip } from '..';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: string | React.ReactNode;
  onTooltipClick?: () => void;
};

export const Label = ({
  children,
  tooltip,
  onTooltipClick,

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
          onClick={onTooltipClick}
        >
          <Icon inline icon="info" />
          <Tooltip
            anchorSelect={'.anchor-element'}
            clickable={onTooltipClick ? true : false}
            place="right"
          >
            {tooltip}
          </Tooltip>
        </Text>
      )}
    </LabelUi>
  );
};
