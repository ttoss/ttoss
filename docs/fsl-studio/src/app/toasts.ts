import { createToastQueue } from '@ttoss/fsl-ui';

/**
 * The app-wide toast queue. Created once at module scope (fsl-ui pattern);
 * `<ToastRegion queue={toastQueue} />` is mounted in `App`.
 */
export const toastQueue = createToastQueue({ maxVisibleToasts: 3 });
