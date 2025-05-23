/**
 * We're using React Select component to build ttoss Select.
 * More info about React Select: https://react-select.com/home
 * ttoss Figma: https://www.figma.com/file/VrB76VkH4hKCDUe9iYhpYu/_Component-%2F-Forms-%2F-Select?type=design&mode=design&t=ZBIeOpqcvQn3yq2t-0
 */
import { Icon, IconType } from '@ttoss/react-icons';
import * as React from 'react';
import ReactSelect, {
  components,
  type ContainerProps,
  type ControlProps,
  type DropdownIndicatorProps,
  type IndicatorsContainerProps,
  type PlaceholderProps,
  type Props as ReactSelectProps,
  type ValueContainerProps,
} from 'react-select';
import { type SxProp } from 'theme-ui';

import { Box, Flex, Text } from '..';

type SelectOptionValue = string | number | boolean;

export type SelectOption = {
  label: string;
  value: SelectOptionValue;
};

export type SelectOptions = SelectOption[];

/**
 * TODO: remove this when we accept multi select.
 */
type IsMulti = false;

export type SelectProps = Omit<
  ReactSelectProps<SelectOption, IsMulti>,
  'styles' | 'value' | 'onChange' | 'components'
> &
  SxProp & {
    value?: SelectOptionValue;
    onChange?: (value: SelectOptionValue | undefined) => void;
    disabled?: boolean;
    leadingIcon?: IconType;
    trailingIcon?: IconType;
  };

const Control = (props: ControlProps<SelectOption, IsMulti>) => {
  const isDisabled = props.selectProps.isDisabled;

  const hasError = props.selectProps['aria-invalid'] === 'true';

  const borderColor = (() => {
    if (isDisabled) {
      return 'display.border.muted.default';
    }

    if (hasError) {
      return 'display.border.negative.default';
    }

    return 'display.border.muted.default';
  })();

  const backgroundColor = (() => {
    if (isDisabled) {
      return 'display.background.muted.default';
    }

    return 'display.background.secondary.default';
  })();

  return (
    <Box
      sx={{
        '.react-select__control': {
          borderColor,
          backgroundColor,
          paddingX: '4',
          paddingY: '3',
        },
      }}
    >
      <components.Control {...props} />
    </Box>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DropdownIndicator = (
  props: DropdownIndicatorProps<SelectOption, IsMulti>
) => {
  const isDisabled = props.selectProps.isDisabled;

  const color = (() => {
    if (isDisabled) {
      return 'display.text.muted.default';
    }

    return 'text';
  })();

  return (
    <Text
      sx={{
        fontSize: 'md',
        color,
        alignSelf: 'center',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Icon icon="picker-down" />
    </Text>
  );
};

const IndicatorsContainer = ({
  children,
}: IndicatorsContainerProps<SelectOption, IsMulti>) => {
  return (
    <Box
      sx={{
        marginLeft: '4',
        border: 'none',
      }}
    >
      {children}
    </Box>
  );
};

const Placeholder = ({ children }: PlaceholderProps<SelectOption, IsMulti>) => {
  return (
    <Text
      sx={{
        color: 'onMuted',
        alignSelf: 'center',
      }}
    >
      {children}
    </Text>
  );
};

const SelectContainer = ({
  children,
  ...props
}: ContainerProps<SelectOption, IsMulti>) => {
  const { sx, css } = props.selectProps as unknown as SelectProps;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Box sx={sx as any} css={css}>
      <components.SelectContainer {...props}>
        {children}
      </components.SelectContainer>
    </Box>
  );
};

const ValueContainer = ({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...props
}: ValueContainerProps<SelectOption, IsMulti>) => {
  const { leadingIcon, trailingIcon, isSearchable } =
    props.selectProps as unknown as SelectProps;

  const hasError = props.selectProps['aria-invalid'] === 'true';

  const trailingIconColor = (() => {
    if (hasError) {
      return 'danger';
    }

    return 'text';
  })();

  const finalLeadingIcon = (() => {
    if (!isSearchable) {
      return leadingIcon;
    }

    return leadingIcon || 'search';
  })();

  return (
    <Flex
      sx={{
        gap: '4',
        flex: 1,
      }}
    >
      {finalLeadingIcon && (
        <Text
          sx={{
            alignSelf: 'center',
            pointerEvents: 'none',
            lineHeight: 0,
            fontSize: 'md',
          }}
        >
          <Icon icon={finalLeadingIcon} />
        </Text>
      )}
      <Flex
        sx={{
          flex: 1,
          alignItems: 'center',
        }}
      >
        {children}
      </Flex>
      {(trailingIcon || hasError) && (
        <Text
          className={hasError ? 'error-icon' : ''}
          sx={{
            alignSelf: 'center',
            pointerEvents: 'none',
            lineHeight: 0,
            fontSize: 'md',
            color: trailingIconColor,
          }}
        >
          <Icon icon={hasError ? 'warning-alt' : (trailingIcon as IconType)} />
        </Text>
      )}
    </Flex>
  );
};

/**
 * https://react-select.com/home
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Select = React.forwardRef<any, SelectProps>(
  ({ ...props }, ref) => {
    const value = props.options?.find((option) => {
      if ('value' in option) {
        return option.value === props.value;
      }

      return false;
    }) as SelectOption | undefined;

    return (
      <ReactSelect<SelectOption, IsMulti>
        ref={ref}
        /**
         * https://react-select.com/components
         */
        components={{
          Control,
          DropdownIndicator,
          IndicatorsContainer,
          Placeholder,
          SelectContainer,
          ValueContainer,
        }}
        isDisabled={props.disabled}
        {...props}
        value={value}
        onChange={(value) => {
          props.onChange?.(value?.value);
        }}
        styles={{
          input: (baseStyles) => {
            return {
              ...baseStyles,
              position: 'absolute',
            };
          },
        }}
        /**
         * https://react-select.com/styles#the-classnameprefix-prop
         */
        classNamePrefix="react-select"
      />
    );
  }
);

Select.displayName = 'Select';
