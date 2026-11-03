/**
 * Runtime configuration of the service worker shipped as `@ttoss/react-pwa/sw.js`.
 *
 * The app passes it as search params on the registration URL (see
 * `buildServiceWorkerUrl`), so the same prebuilt file serves every app.
 */
export type ServiceWorkerConfig = {
  /**
   * Cache name. Change it to drop every entry cached by a previous version.
   */
  cacheName: string;
  /**
   * Same-origin paths fetched into the cache on install.
   */
  precache: string[];
  /**
   * Same-origin path prefixes served cache-first (icons, manifest, favicon).
   * Every other request goes to the network untouched, so navigations and
   * hashed bundles always reflect the latest deploy.
   */
  cachePaths: string[];
  /**
   * Notification title when a push payload has none.
   */
  defaultTitle: string;
  /**
   * Notification body when a push payload has none.
   */
  defaultBody: string;
  /**
   * URL opened when a notification without `url` is clicked.
   */
  defaultUrl: string;
  /**
   * Notification icon when a push payload has none.
   */
  icon?: string;
  /**
   * Notification badge when a push payload has none.
   */
  badge?: string;
};

export const DEFAULT_SERVICE_WORKER_CONFIG: ServiceWorkerConfig = {
  cacheName: 'ttoss-pwa-v1',
  precache: [],
  cachePaths: ['/icons/', '/manifest.json', '/favicon.ico'],
  defaultTitle: 'Notification',
  defaultBody: 'You have a new notification.',
  defaultUrl: '/',
};

const LIST_KEYS = ['precache', 'cachePaths'] as const;

const STRING_KEYS = [
  'cacheName',
  'defaultTitle',
  'defaultBody',
  'defaultUrl',
  'icon',
  'badge',
] as const;

const LIST_SEPARATOR = ',';

/**
 * Serializes a partial config into URL search params. Lists are joined by
 * commas, so a path cannot contain one.
 */
export const serializeServiceWorkerConfig = (
  config: Partial<ServiceWorkerConfig>
): URLSearchParams => {
  const params = new URLSearchParams();

  for (const key of STRING_KEYS) {
    const value = config[key];
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  for (const key of LIST_KEYS) {
    const value = config[key];
    if (value !== undefined) {
      params.set(key, value.join(LIST_SEPARATOR));
    }
  }

  return params;
};

/**
 * Reads the config from the service worker's own `location.search`, falling
 * back to `DEFAULT_SERVICE_WORKER_CONFIG` for every missing key.
 */
export const parseServiceWorkerConfig = (
  search: string
): ServiceWorkerConfig => {
  const params = new URLSearchParams(search);
  const config: ServiceWorkerConfig = { ...DEFAULT_SERVICE_WORKER_CONFIG };

  for (const key of STRING_KEYS) {
    const value = params.get(key);
    if (value) {
      config[key] = value;
    }
  }

  for (const key of LIST_KEYS) {
    const value = params.get(key);
    if (value !== null) {
      config[key] = value.split(LIST_SEPARATOR).filter(Boolean);
    }
  }

  return config;
};
