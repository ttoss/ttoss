import { parseServiceWorkerConfig, type ServiceWorkerConfig } from './config';

/**
 * JSON payload a server sends through Web Push. Every field is optional; the
 * service worker fills the gaps from its config.
 */
export type PushPayload = {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  /**
   * Same-origin URL opened when the notification is clicked.
   */
  url?: string;
  /**
   * Any extra data the app wants back on click, kept in
   * `notification.data`.
   */
  data?: Record<string, unknown>;
};

type ExtendableEvent = { waitUntil: (promise: Promise<unknown>) => void };

type FetchEvent = ExtendableEvent & {
  request: Request;
  respondWith: (response: Promise<Response> | Response) => void;
};

type PushEvent = ExtendableEvent & {
  data: { json: () => unknown; text: () => string } | null;
};

type NotificationClickEvent = ExtendableEvent & {
  notification: { close: () => void; data?: { url?: string } };
};

type WindowClient = {
  url: string;
  focus: () => Promise<unknown>;
  navigate: (url: string) => Promise<unknown>;
};

type Listeners = {
  install: (event: ExtendableEvent) => void;
  activate: (event: ExtendableEvent) => void;
  fetch: (event: FetchEvent) => void;
  push: (event: PushEvent) => void;
  notificationclick: (event: NotificationClickEvent) => void;
};

/**
 * The subset of `ServiceWorkerGlobalScope` this worker uses, typed
 * structurally so the package needs no `webworker` lib and tests can pass a
 * fake.
 */
export type ServiceWorkerScope = {
  location: { origin: string; search: string };
  caches: CacheStorage;
  fetch: (request: Request) => Promise<Response>;
  skipWaiting: () => Promise<void>;
  clients: {
    claim: () => Promise<void>;
    matchAll: (options: {
      type: 'window';
      includeUncontrolled: boolean;
    }) => Promise<WindowClient[]>;
    openWindow: (url: string) => Promise<unknown>;
  };
  registration: {
    showNotification: (
      title: string,
      options: NotificationOptions
    ) => Promise<void>;
  };
  addEventListener: <K extends keyof Listeners>(
    type: K,
    listener: Listeners[K]
  ) => void;
};

const readPushPayload = ({
  event,
  config,
}: {
  event: PushEvent;
  config: ServiceWorkerConfig;
}): PushPayload => {
  if (!event.data) {
    return {};
  }

  try {
    const json = event.data.json();
    return json && typeof json === 'object' ? (json as PushPayload) : {};
  } catch {
    return { title: config.defaultTitle, body: event.data.text() };
  }
};

/**
 * Builds the `showNotification` arguments from a push payload and the config
 * defaults.
 */
export const buildNotification = ({
  payload,
  config,
}: {
  payload: PushPayload;
  config: ServiceWorkerConfig;
}): { title: string; options: NotificationOptions } => {
  return {
    title: payload.title || config.defaultTitle,
    options: {
      body: payload.body || config.defaultBody,
      icon: payload.icon || config.icon,
      badge: payload.badge || config.badge,
      data: { ...payload.data, url: payload.url || config.defaultUrl },
      requireInteraction: false,
    },
  };
};

/**
 * Whether a request is served cache-first: a same-origin GET under one of
 * `config.cachePaths`, never a navigation.
 */
export const isCacheFirstRequest = ({
  request,
  origin,
  config,
}: {
  request: Request;
  origin: string;
  config: ServiceWorkerConfig;
}): boolean => {
  if (request.method !== 'GET' || request.mode === 'navigate') {
    return false;
  }

  const url = new URL(request.url);

  if (url.origin !== origin) {
    return false;
  }

  return config.cachePaths.some((path) => {
    return url.pathname.startsWith(path);
  });
};

type Handler<K extends keyof Listeners> = (args: {
  scope: ServiceWorkerScope;
  config: ServiceWorkerConfig;
}) => Listeners[K];

const onInstall: Handler<'install'> = ({ scope, config }) => {
  return (event) => {
    event.waitUntil(
      scope.caches.open(config.cacheName).then((cache) => {
        return cache.addAll(config.precache);
      })
    );
    scope.skipWaiting();
  };
};

const deleteOtherCaches = async ({
  scope,
  config,
}: {
  scope: ServiceWorkerScope;
  config: ServiceWorkerConfig;
}) => {
  const keys = await scope.caches.keys();
  const stale = keys.filter((key) => {
    return key !== config.cacheName;
  });

  await Promise.all(
    stale.map((key) => {
      return scope.caches.delete(key);
    })
  );
};

const onActivate: Handler<'activate'> = ({ scope, config }) => {
  return (event) => {
    event.waitUntil(
      deleteOtherCaches({ scope, config }).then(() => {
        return scope.clients.claim();
      })
    );
  };
};

const onFetch: Handler<'fetch'> = ({ scope, config }) => {
  const fromNetwork = async (event: FetchEvent) => {
    const response = await scope.fetch(event.request);

    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(
        scope.caches.open(config.cacheName).then((cache) => {
          return cache.put(event.request, copy);
        })
      );
    }

    return response;
  };

  return (event) => {
    const { request } = event;

    if (
      !isCacheFirstRequest({ request, origin: scope.location.origin, config })
    ) {
      return;
    }

    event.respondWith(
      scope.caches.match(request).then((cached) => {
        return cached ?? fromNetwork(event);
      })
    );
  };
};

const onPush: Handler<'push'> = ({ scope, config }) => {
  return (event) => {
    if (!event.data) {
      return;
    }

    const { title, options } = buildNotification({
      payload: readPushPayload({ event, config }),
      config,
    });

    event.waitUntil(scope.registration.showNotification(title, options));
  };
};

const focusOrOpen = async ({
  scope,
  url,
}: {
  scope: ServiceWorkerScope;
  url: string;
}) => {
  const clients = await scope.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  const client = clients.find((candidate) => {
    return candidate.url.startsWith(scope.location.origin);
  });

  if (!client) {
    return scope.clients.openWindow(url);
  }

  await client.navigate(url);
  return client.focus();
};

const onNotificationClick: Handler<'notificationclick'> = ({
  scope,
  config,
}) => {
  return (event) => {
    event.notification.close();

    const url = event.notification.data?.url || config.defaultUrl;

    event.waitUntil(focusOrOpen({ scope, url }));
  };
};

/**
 * Wires the install, activate, fetch, push and notificationclick listeners on
 * a service worker scope. `sw.ts` calls it with `self`.
 */
export const createServiceWorker = (scope: ServiceWorkerScope) => {
  const config = parseServiceWorkerConfig(scope.location.search);
  const args = { scope, config };

  scope.addEventListener('install', onInstall(args));
  scope.addEventListener('activate', onActivate(args));
  scope.addEventListener('fetch', onFetch(args));
  scope.addEventListener('push', onPush(args));
  scope.addEventListener('notificationclick', onNotificationClick(args));

  return { config };
};
