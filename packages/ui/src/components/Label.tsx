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
  const id = React.useId();

  const tooltipId = `${id}-tooltip`;

  return (
    <LabelUi
      data-tooltip-id={tooltipId}
      sx={{
        alignItems: 'center',
        fontSize: 'sm',
        lineHeight: 'normal',
        width: 'fit-content',
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
          aria-label={TOOLTIP_LABEL}
          onClick={onTooltipClick}
        >
          <Icon inline icon="fluent:info-24-regular" />
          <Tooltip
            id={tooltipId}
            clickable={onTooltipClick ? true : false}
            place="top"
          >
            {tooltip}
          </Tooltip>
        </Text>
      )}
    </LabelUi>
  );
};
