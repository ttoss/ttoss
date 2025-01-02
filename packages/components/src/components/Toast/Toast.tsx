import { Box } from '@ttoss/ui';
import {
  ToastContainer as ReactToastifyToastContainer,
  type ToastContainerProps,
  toast,
} from 'react-toastify';

export { toast };

export { type ToastContainerProps };

export const ToastContainer = (props: ToastContainerProps) => {
  return (
    <Box
      sx={({ colors, fonts }) => {
        return {
          '--toastify-color-light': '#fff',
          '--toastify-color-dark': '#121212',
          '--toastify-color-info': colors?.info || '#3498db',
          '--toastify-color-success': colors?.success || '#07bc0c',
          '--toastify-color-warning': '#f1c40f',
          '--toastify-color-error': '#e74c3c',
          '--toastify-color-progress-light': `linear-gradient(to right, ${colors?.primary}, ${colors?.secondary})`,
          '--toastify-font-family': (fonts as { body: string }).body,
        };
      }}
    >
      <ReactToastifyToastContainer {...props} />
    </Box>
  );
};
