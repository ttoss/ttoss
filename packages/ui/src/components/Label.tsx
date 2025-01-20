import { Icon } from '@ttoss/react-icons';
import * as React from 'react';
import { Tooltip } from 'react-tooltip';
import { Label as LabelUi, type LabelProps as LabelPropsUi } from 'theme-ui';

import { Text } from '..';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: string | boolean | React.ReactNode;
  tooltipClickable?: boolean;
  tooltipStyle?: React.CSSProperties;
};

export const Label = ({
  children,
  tooltip,
  tooltipClickable,
  tooltipStyle,
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
            style={{
              ...(tooltipStyle as React.CSSProperties),
            }}
          >
            {typeof tooltip === 'string' && (
              <Text sx={{ color: 'white' }}>{tooltip}</Text>
            )}
            {typeof tooltip === 'boolean' && (
              <Text sx={{ color: 'white' }}>
                Por favor, preste atenção aos detalhes nesta seção
              </Text>
            )}
            {React.isValidElement(tooltip) && tooltip}
          </Tooltip>
        </Text>
      )}
    </LabelUi>
  );
};
