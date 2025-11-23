import { Icon, type IconType } from '@ttoss/react-icons';
import { Input as InputUI, InputProps as InputPropsUI } from 'theme-ui';

import { Flex, Text, Tooltip } from '..';
import { type TooltipProps } from './Tooltip';

export interface InputIconConfig {
  icon: IconType;
  onClick?: () => void;
  tooltip?: string;
  tooltipProps?: Omit<TooltipProps, 'children' | 'anchorSelect'>;
}

export interface InputProps extends InputPropsUI {
  leadingIcon?: InputIconConfig | IconType;
  trailingIcon?: InputIconConfig | IconType;
}

const isInputIconConfig = (
  icon: InputIconConfig | IconType | undefined
): icon is InputIconConfig => {
  return (
    icon !== undefined &&
    typeof icon === 'object' &&
    'icon' in icon &&
    (typeof icon.icon === 'string' ||
      (typeof icon.icon === 'object' && 'body' in icon.icon))
  );
};

const normalizeIcon = (
  icon: InputIconConfig | IconType | undefined
): InputIconConfig | undefined => {
  if (!icon) {
    return undefined;
  }
  if (isInputIconConfig(icon)) {
    return icon;
  }
  return { icon };
};

export const Input = ({
  leadingIcon,
  trailingIcon: trailingIconProp,
  className,
  sx,
  ...inputProps
}: InputProps) => {
  const normalizedLeadingIcon = normalizeIcon(leadingIcon);

  const normalizedTrailingIconProp = normalizeIcon(trailingIconProp);

  const ariaInvalid = inputProps['aria-invalid'];
  const isInvalid = ariaInvalid === true || ariaInvalid === 'true';

  const trailingIcon = isInvalid
    ? { ...normalizedTrailingIconProp, icon: 'warning-alt' as IconType }
    : normalizedTrailingIconProp;

  const isWarning = !isInvalid && trailingIcon?.icon === 'warning-alt';

  const wrapperClassName = [className, isWarning && 'is-warning']
    .filter(Boolean)
    .join(' ');

  return (
    <Flex
      className={wrapperClassName}
      sx={{ ...sx, position: 'relative', padding: 0, border: 'none' }}
    >
      {normalizedLeadingIcon && (
        <>
          <Text
            data-testid="input-leading-icon"
            data-tooltip-id={
              normalizedLeadingIcon.tooltip
                ? 'input-leading-icon-tooltip'
                : undefined
            }
            sx={{
              position: 'absolute',
              alignSelf: 'center',
              left: '1rem',
              cursor: normalizedLeadingIcon.onClick ? 'pointer' : 'default',
            }}
            onClick={normalizedLeadingIcon.onClick}
            variant="leading-icon"
          >
            <Icon inline icon={normalizedLeadingIcon.icon} />
          </Text>
          {normalizedLeadingIcon.tooltip && (
            <Tooltip
              id="input-leading-icon-tooltip"
              {...normalizedLeadingIcon.tooltipProps}
            >
              {normalizedLeadingIcon.tooltip}
            </Tooltip>
          )}
        </>
      )}
      <InputUI
        sx={{
          fontFamily: 'body',
          paddingY: '3',
          paddingX: '4',
          ...sx,
          paddingLeft: leadingIcon ? '10' : undefined,
          paddingRight: trailingIcon ? '10' : undefined,
          margin: 0,
        }}
        className={className}
        {...inputProps}
      />

      {trailingIcon && (
        <>
          <Text
            data-testid="input-trailing-icon"
            data-tooltip-id={
              trailingIcon.tooltip ? 'input-trailing-icon-tooltip' : undefined
            }
            sx={{
              position: 'absolute',
              right: '1rem',
              alignSelf: 'center',
              color: isWarning ? 'feedback.text.caution.default' : undefined,
              cursor: trailingIcon.onClick ? 'pointer' : 'default',
              fontSize: 'xl',
            }}
            variant="trailing-icon"
            onClick={trailingIcon.onClick}
          >
            <Icon inline icon={trailingIcon.icon} />
          </Text>
          {trailingIcon.tooltip && (
            <Tooltip
              id="input-trailing-icon-tooltip"
              {...trailingIcon.tooltipProps}
            >
              {trailingIcon.tooltip}
            </Tooltip>
          )}
        </>
      )}
    </Flex>
  );
};
