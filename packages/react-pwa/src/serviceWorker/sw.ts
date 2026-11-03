/**
 * Entry of the prebuilt `dist/sw.js`. Apps copy that file to the root of their
 * public folder and register it with `registerServiceWorker`.
 */
import {
  createServiceWorker,
  type ServiceWorkerScope,
} from './createServiceWorker';

createServiceWorker(self as unknown as ServiceWorkerScope);
