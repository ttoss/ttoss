/* eslint-disable @typescript-eslint/no-explicit-any */
import { css as createClassName } from '@emotion/css';
import { css as transformStyleObject } from '@theme-ui/css';
import { Box, useTheme } from '@ttoss/ui';
import * as React from 'react';
import {
  toast as toastReactToastify,
  ToastContainer as ReactToastifyToastContainer,
  type ToastContainerProps,
  type ToastOptions,
} from 'react-toastify';

export type { ToastContainerProps, ToastOptions };

export const ToastContainer = (props: ToastContainerProps) => {
  const { theme } = useTheme();

  const className = React.useMemo(() => {
    /**
     * https://fkhadra.github.io/react-toastify/how-to-style#override-existing-css-classes
     */
    const styles = transformStyleObject({
      '.Toastify__toast-container': {},
    })(theme);

    return createClassName(styles);
  }, [theme]);

  return (
    <Box
      className={className}
      sx={({ colors, fonts }) => {
        const themeColors = colors as Record<string, any>;

        /**
         * https://fkhadra.github.io/react-toastify/how-to-style#override-css-variables
         */
        return {
          '--toastify-font-family': (fonts as any)?.body,
          '--toastify-color-light':
            themeColors?.feedback?.background?.primary?.default,
        };
      }}
    >
      <ReactToastifyToastContainer className={className} {...props} />
    </Box>
  );
};

export const toast = toastReactToastify;
