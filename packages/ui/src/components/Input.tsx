import { Flex, Icon, type IconType, Text } from '..';
import React from 'react';

import { type InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';

export type InputProps = InputPropsUI & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, trailingIcon, sx, ...inputProps }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const iconsContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          ref.current = inputRef.current;
        }
      }
    }, [ref]);

    const setIconsContainerPosition = React.useCallback(() => {
      if (iconsContainerRef.current && inputRef.current) {
        const { width, height, top, left } =
          inputRef.current.getBoundingClientRect();
        iconsContainerRef.current.style.width = `${width}px`;
        iconsContainerRef.current.style.height = `${height}px`;
        iconsContainerRef.current.style.top = `${top}px`;
        iconsContainerRef.current.style.left = `${left}px`;
      }
    }, []);

    /**
     * This effect is used to update the styles of the container of the icons.
     * It should have the same width, height and position of the input.
     */
    React.useLayoutEffect(() => {
      setIconsContainerPosition();
    }, [setIconsContainerPosition]);

    /**
     * Listen to resize events of the input to update the position of the
     * container of the icons.
     */
    React.useEffect(() => {
      const resizeObserver = new ResizeObserver(() => {
        setIconsContainerPosition();
      });

      if (inputRef.current) {
        resizeObserver.observe(inputRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [setIconsContainerPosition]);

    const iconsContainerElement = React.useMemo(() => {
      if (!leadingIcon && !trailingIcon) {
        return null;
      }

      return (
        <Flex
          ref={iconsContainerRef}
          sx={{
            position: 'absolute',
            border: 'default',
            borderColor: 'red',
            /**
             * https://stackoverflow.com/questions/38702164/how-to-make-a-link-beneath-a-div-clickable
             */
            pointerEvents: 'none',
          }}
        >
          {leadingIcon && (
            <Text
              sx={{
                position: 'absolute',
                alignSelf: 'center',
                fontSize: 'base',
                left: '1rem',
                lineHeight: 0,
              }}
              variant="leading-icon"
            >
              <Icon icon={leadingIcon} />
            </Text>
          )}

          {trailingIcon && (
            <Text
              sx={{
                position: 'absolute',
                right: '1rem',
                alignSelf: 'center',
                fontSize: 'base',
                lineHeight: 0,
              }}
              variant="trailing-icon"
            >
              <Icon icon={trailingIcon} />
            </Text>
          )}
        </Flex>
      );
    }, [leadingIcon, trailingIcon]);

    return (
      <>
        <InputUI
          ref={inputRef}
          sx={{
            paddingLeft: leadingIcon ? '3xl' : undefined,
            paddingRight: trailingIcon ? '3xl' : undefined,
            ...sx,
          }}
          {...inputProps}
        />
        {iconsContainerElement}
      </>
    );
  }
);

Input.displayName = 'Input';
