import { Icon } from '@ttoss/react-icons';
import * as React from 'react';
import { Label as LabelUi, type LabelProps as LabelPropsUi } from 'theme-ui';

import { Text } from '..';
import { Tooltip } from '..';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: {
    render: string | React.ReactNode;
    place: 'top' | 'right' | 'bottom' | 'left';
    openOnClick?: boolean;
    clickable?: boolean;
    variant?: 'dark' | 'light' | 'success' | 'warning' | 'error' | 'info';
    hidden?: boolean;
    setIsOpen?: (value: boolean) => void;
    isOpen?: boolean;
  };
};

export const Label = ({ children, tooltip, sx, ...props }: LabelProps) => {
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
        color: 'input.text.secondary.default',
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
        >
          <Icon inline icon="fluent:info-24-regular" />
          <Tooltip
            id={tooltipId}
            openOnClick={tooltip.openOnClick}
            clickable={tooltip.clickable}
            place={tooltip.place}
            hidden={tooltip.hidden}
            variant={tooltip.variant}
            setIsOpen={tooltip.setIsOpen}
            isOpen={tooltip.isOpen}
          >
            {tooltip.render}
          </Tooltip>
        </Text>
      )}
    </LabelUi>
  );
};
