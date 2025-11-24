import { Icon, type IconType } from '@ttoss/react-icons';
import * as React from 'react';

import { Text, Tooltip } from '..';
import { type TooltipProps } from './Tooltip';

/**
 * Props for the TooltipIcon component.
 */
export interface TooltipIconProps {
  /**
   * The icon to display. Can be a string identifier or an icon object from @ttoss/react-icons.
   */
  icon: IconType;
  /**
   * Optional click handler for the icon.
   */
  onClick?: () => void;
  /**
   * Optional tooltip text to display when hovering over the icon.
   */
  tooltip?: string;
  /**
   * Additional props to pass to the Tooltip component.
   * Excludes 'children', 'anchorSelect', and 'variant' which are managed internally.
   */
  tooltipProps?: Omit<TooltipProps, 'children' | 'anchorSelect' | 'variant'>;
  /**
   * Test ID for testing purposes.
   */
  'data-testid'?: string;
  /**
   * Visual variant for both the text wrapper and tooltip.
   * @default 'info'
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /**
   * Additional styles to apply to the Text wrapper component.
   */
  sx?: Record<string, unknown>;
}

/**
 * TooltipIcon component renders an icon with an optional tooltip.
 *
 * This component is useful for displaying icons with explanatory tooltips,
 * especially in contexts where space is limited or additional information
 * should be revealed on hover.
 *
 * @example
 * ```tsx
 * <TooltipIcon
 *   icon="info-circle"
 *   tooltip="Additional information"
 *   variant="info"
 * />
 * ```
 *
 * @example
 * ```tsx
 * <TooltipIcon
 *   icon="warning-alt"
 *   tooltip="Warning message"
 *   variant="warning"
 *   onClick={() => console.log('Clicked')}
 * />
 * ```
 */

export const TooltipIcon = ({
  icon,
  onClick,
  tooltip,
  tooltipProps,
  'data-testid': dataTestId,
  variant,
  sx,
}: TooltipIconProps) => {
  const id = React.useId();
  const tooltipId = `${id}-tooltip`;

  return (
    <>
      <Text
        data-testid={dataTestId}
        data-tooltip-id={tooltip ? tooltipId : undefined}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          ...sx,
        }}
        onClick={onClick}
        variant={variant}
      >
        <Icon inline icon={icon} />
      </Text>
      {tooltip && (
        <Tooltip id={tooltipId} {...tooltipProps} variant={variant}>
          {tooltip}
        </Tooltip>
      )}
    </>
  );
};
