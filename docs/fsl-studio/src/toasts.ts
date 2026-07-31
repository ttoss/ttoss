import { createToastQueue } from '@ttoss/fsl-ui';

/** Single app-wide toast queue; `<ToastRegion>` renders it once in App. */
export const toasts = createToastQueue({ maxVisibleToasts: 3 });
