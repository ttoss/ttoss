import { Icon, Text } from '..';
import { type LabelProps as LabelPropsUi, Label as LabelUi } from 'theme-ui';

const TOOLTIP_LABEL = 'tooltip';

export type LabelProps = LabelPropsUi & {
  tooltip?: boolean;
  onTooltipClick?: () => void;
};

export const Label = ({
  children,
  onTooltipClick,
  tooltip,
  ...props
}: LabelProps) => {
  return (
    <LabelUi {...props}>
      {children}

      {tooltip && (
        <Text
          sx={{ color: 'currentcolor' }}
          onClick={onTooltipClick}
          aria-label={TOOLTIP_LABEL}
        >
          <Icon inline icon="info" />
        </Text>
      )}
    </LabelUi>
  );
};
