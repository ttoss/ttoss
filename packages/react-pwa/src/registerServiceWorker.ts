import {
  serializeServiceWorkerConfig,
  type ServiceWorkerConfig,
} from './serviceWorker/config';

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export const DEFAULT_SERVICE_WORKER_URL = '/sw.js';

/**
 * Whether a hostname is the local machine, where a service worker would keep
 * serving stale assets between dev reloads.
 */
export const isLocalhostHostname = (hostname: string): boolean => {
  return LOCALHOST_HOSTNAMES.has(hostname);
};

/**
 * Appends the service worker config to its script URL as search params, which
 * the worker reads from its own `location.search`.
 */
export const buildServiceWorkerUrl = ({
  url = DEFAULT_SERVICE_WORKER_URL,
  config = {},
}: {
  url?: string;
  config?: Partial<ServiceWorkerConfig>;
} = {}): string => {
  const search = serializeServiceWorkerConfig(config).toString();

  if (!search) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${search}`;
};

const isServiceWorkerSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
};

/**
 * Unregisters every service worker of this origin and deletes every cache it
 * left, so a local dev server never serves assets from a previous build.
 */
export const unregisterServiceWorkers = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations.map((registration) => {
      return registration.unregister();
    })
  );

  if (typeof caches !== 'undefined') {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        return caches.delete(key);
      })
    );
  }
};

export type RegisterServiceWorkerOptions = {
  /**
   * Script URL. It must sit at the origin root (or be served with a
   * `Service-Worker-Allowed` header) to control every page.
   */
  url?: string;
  /**
   * Passed to the worker through the script URL.
   */
  config?: Partial<ServiceWorkerConfig>;
  /**
   * When `false`, unregisters every worker and clears every cache instead of
   * registering. Defaults to `true` everywhere but localhost; apps usually
   * pass their production check too.
   */
  enabled?: boolean;
};

/**
 * Registers the service worker, or cleans it up when `enabled` is `false`.
 * Returns the registration, or `null` when nothing was registered.
 */
export const registerServiceWorker = async ({
  url,
  config,
  enabled,
}: RegisterServiceWorkerOptions = {}): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  const shouldRegister =
    enabled ?? !isLocalhostHostname(window.location.hostname);

  if (!shouldRegister) {
    await unregisterServiceWorkers();
    return null;
  }

  return navigator.serviceWorker.register(
    buildServiceWorkerUrl({ url, config })
  );
};
