/**
 * We're using React Select component to build ttoss Select.
 * More info about React Select: https://react-select.com/home
 * ttoss Figma: https://www.figma.com/file/VrB76VkH4hKCDUe9iYhpYu/_Component-%2F-Forms-%2F-Select?type=design&mode=design&t=ZBIeOpqcvQn3yq2t-0
 */
import * as React from 'react';
import { Box, Flex, Text } from '..';
import { Icon, IconType } from '@ttoss/react-icons';
import { type SxProp } from 'theme-ui';
import ReactSelect, {
  type ContainerProps,
  type ControlProps,
  type DropdownIndicatorProps,
  type IndicatorsContainerProps,
  type PlaceholderProps,
  type Props as ReactSelectProps,
  type ValueContainerProps,
  components,
} from 'react-select';

export type SelectOption = {
  label: string;
  value: string | number;
};

export type SelectOptions = SelectOption[];

/**
 * TODO: remove this when we accept multi select.
 */
type IsMulti = false;

export type SelectProps = ReactSelectProps<SelectOption, IsMulti> &
  SxProp & {
    disabled?: boolean;
    leadingIcon?: IconType;
    trailingIcon?: IconType;
  };

const Control = (props: ControlProps<SelectOption, IsMulti>) => {
  const isDisabled = props.selectProps.isDisabled;

  const hasError = props.selectProps['aria-invalid'] === 'true';

  const border = (() => {
    if (isDisabled) {
      return 'muted';
    }

    if (hasError) {
      return 'danger';
    }

    return 'interaction';
  })();

  const backgroundColor = (() => {
    if (isDisabled) {
      return 'muted';
    }

    return 'surface';
  })();

  return (
    <Box
      sx={{
        '.react-select__control': {
          border,
          backgroundColor,
          paddingX: 'xl',
          paddingY: 'lg',
          borderRadius: 'action',
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
      return 'onMuted';
    }

    return 'text';
  })();

  return (
    <Text
      sx={{
        fontSize: 'base',
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...props
}: IndicatorsContainerProps<SelectOption, IsMulti>) => {
  return (
    <Box
      sx={{
        marginLeft: 'lg',
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
  const { sx, css } = props.selectProps as SelectProps;

  return (
    <Box sx={sx} css={css}>
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
  const { leadingIcon, trailingIcon } = props.selectProps as SelectProps;

  const hasError = props.selectProps['aria-invalid'] === 'true';

  const trailingIconColor = (() => {
    if (hasError) {
      return 'danger';
    }

    return 'text';
  })();

  return (
    <Flex
      sx={{
        gap: 'lg',
        flex: 1,
      }}
    >
      {leadingIcon && (
        <Text
          sx={{
            alignSelf: 'center',
            pointerEvents: 'none',
            lineHeight: 0,
            fontSize: 'base',
          }}
        >
          <Icon icon={leadingIcon} />
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
            fontSize: 'base',
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
          ...props.components,
        }}
        isDisabled={props.disabled}
        {...props}
        /**
         * https://react-select.com/styles#the-classnameprefix-prop
         */
        classNamePrefix="react-select"
      />
    );
  }
);

Select.displayName = 'Select';
