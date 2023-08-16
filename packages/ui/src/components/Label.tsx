import { Icon } from '@ttoss/react-icons';
import { type LabelProps as LabelPropsUi, Label as LabelUi } from 'theme-ui';
import { Text } from '..';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: boolean;
  onTooltipClick?: () => void;
};

export const Label = ({
  children,
  onTooltipClick,
  tooltip,
  sx,
  ...props
}: LabelProps) => {
  return (
    <LabelUi
      sx={{
        fontFamily: 'caption',
        alignItems: 'center',
        fontSize: 'sm',
        lineHeight: 'base',
        ...sx,
      }}
      {...props}
    >
      {children}

      {tooltip && (
        <Text
          sx={{
            color: 'currentcolor',
            cursor: onTooltipClick ? 'pointer' : undefined,
          }}
          onClick={onTooltipClick}
          aria-label={TOOLTIP_LABEL}
        >
          <Icon inline icon="info" />
        </Text>
      )}
    </LabelUi>
  );
};
