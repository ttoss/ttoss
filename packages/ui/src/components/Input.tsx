import { type IconType } from '@ttoss/react-icons';
import { Input as InputUI, InputProps as InputPropsUI } from 'theme-ui';

import { Flex, TooltipIcon } from '..';
import { type TooltipIconProps } from './TooltipIcon';

export interface InputProps extends InputPropsUI {
  leadingIcon?: TooltipIconProps | IconType;
  trailingIcon?: TooltipIconProps | IconType;
}

const isInputIconConfig = (
  icon: TooltipIconProps | IconType | undefined
): icon is TooltipIconProps => {
  return (
    icon !== undefined &&
    typeof icon === 'object' &&
    'icon' in icon &&
    (typeof icon.icon === 'string' ||
      (typeof icon.icon === 'object' && 'body' in icon.icon))
  );
};

const normalizeIcon = (
  icon: TooltipIconProps | IconType | undefined
): TooltipIconProps | undefined => {
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
        <TooltipIcon
          {...normalizedLeadingIcon}
          data-testid="input-leading-icon"
          variant={normalizedLeadingIcon.variant ?? 'info'}
          sx={{
            position: 'absolute',
            alignSelf: 'center',
            left: '1rem',
            ...normalizedLeadingIcon.sx,
          }}
        />
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
        <TooltipIcon
          {...trailingIcon}
          data-testid="input-trailing-icon"
          variant={trailingIcon.variant ?? 'info'}
          sx={{
            position: 'absolute',
            right: '1rem',
            alignSelf: 'center',
            color: isWarning ? 'feedback.text.caution.default' : undefined,
            fontSize: 'xl',
            ...trailingIcon.sx,
          }}
        />
      )}
    </Flex>
  );
};
