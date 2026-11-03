import {
  createServiceWorker,
  DEFAULT_SERVICE_WORKER_CONFIG,
  parseServiceWorkerConfig,
  serializeServiceWorkerConfig,
  type ServiceWorkerScope,
} from 'src/index';

const ORIGIN = 'https://app.example.com';

type Listener = (event: unknown) => void;

const createScope = ({ search = '' }: { search?: string } = {}) => {
  const listeners: Record<string, Listener> = {};
  const cache = {
    addAll: jest.fn().mockResolvedValue(undefined),
    put: jest.fn().mockResolvedValue(undefined),
  };
  const clientsList: Array<{
    url: string;
    focus: jest.Mock;
    navigate: jest.Mock;
  }> = [];

  const scope = {
    location: { origin: ORIGIN, search },
    caches: {
      open: jest.fn().mockResolvedValue(cache),
      keys: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(true),
      match: jest.fn().mockResolvedValue(undefined),
    },
    fetch: jest.fn(),
    skipWaiting: jest.fn().mockResolvedValue(undefined),
    clients: {
      claim: jest.fn().mockResolvedValue(undefined),
      matchAll: jest.fn(async () => {
        return clientsList;
      }),
      openWindow: jest.fn().mockResolvedValue(undefined),
    },
    registration: {
      showNotification: jest.fn().mockResolvedValue(undefined),
    },
    addEventListener: jest.fn((type: string, listener: Listener) => {
      listeners[type] = listener;
    }),
  };

  createServiceWorker(scope as unknown as ServiceWorkerScope);

  /**
   * Dispatches an event and resolves with whatever it handed to
   * `waitUntil` and `respondWith`.
   */
  const dispatch = async (type: string, event: Record<string, unknown>) => {
    const waited: Promise<unknown>[] = [];
    let response: Promise<unknown> | undefined;

    listeners[type]({
      ...event,
      waitUntil: (promise: Promise<unknown>) => {
        waited.push(promise);
      },
      respondWith: (value: Promise<unknown>) => {
        response = Promise.resolve(value);
      },
    });

    const responded = await response;
    await Promise.all(waited);
    // A cache write is registered with waitUntil after the response resolves.
    await Promise.all(waited);

    return { responded, hasResponded: response !== undefined };
  };

  return { scope, cache, clientsList, dispatch };
};

const request = ({
  path,
  method = 'GET',
  mode = 'cors',
  origin = ORIGIN,
}: {
  path: string;
  method?: string;
  mode?: string;
  origin?: string;
}) => {
  return { url: `${origin}${path}`, method, mode } as unknown as Request;
};

describe('service worker config', () => {
  test('round-trips through search params', () => {
    const config = {
      cacheName: 'myhold-v2',
      precache: ['/manifest.json', '/icons/icon-192x192.png'],
      cachePaths: ['/icons/'],
      defaultTitle: 'MyHold',
      defaultBody: 'Something happened.',
      defaultUrl: '/my/notifications',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
    };

    const search = `?${serializeServiceWorkerConfig(config).toString()}`;

    expect(parseServiceWorkerConfig(search)).toEqual(config);
  });

  test('falls back to the defaults for every missing key', () => {
    expect(parseServiceWorkerConfig('')).toEqual(DEFAULT_SERVICE_WORKER_CONFIG);
  });

  test('an empty list param clears the default list', () => {
    expect(parseServiceWorkerConfig('?cachePaths=').cachePaths).toEqual([]);
  });
});

describe('install and activate', () => {
  test('install precaches the configured paths and skips waiting', async () => {
    const { scope, cache, dispatch } = createScope({
      search: '?cacheName=app-v3&precache=/manifest.json,/logo.svg',
    });

    await dispatch('install', {});

    expect(scope.caches.open).toHaveBeenCalledWith('app-v3');
    expect(cache.addAll).toHaveBeenCalledWith(['/manifest.json', '/logo.svg']);
    expect(scope.skipWaiting).toHaveBeenCalled();
  });

  test('activate deletes caches of other versions and claims clients', async () => {
    const { scope, dispatch } = createScope({ search: '?cacheName=app-v3' });
    scope.caches.keys.mockResolvedValue(['app-v1', 'app-v3', 'app-v2']);

    await dispatch('activate', {});

    expect(scope.caches.delete.mock.calls).toEqual([['app-v1'], ['app-v2']]);
    expect(scope.clients.claim).toHaveBeenCalled();
  });
});

describe('fetch', () => {
  test.each([
    ['a navigation', { path: '/icons/a.png', mode: 'navigate' }],
    ['a POST', { path: '/icons/a.png', method: 'POST' }],
    [
      'a cross-origin request',
      { path: '/icons/a.png', origin: 'https://cdn.example.com' },
    ],
    ['a path outside cachePaths', { path: '/assets/index-abc.js' }],
    ['an API call', { path: '/api/v1/me' }],
  ])('leaves %s to the network', async (_, options) => {
    const { scope, dispatch } = createScope();

    const { hasResponded } = await dispatch('fetch', {
      request: request(options),
    });

    expect(hasResponded).toBe(false);
    expect(scope.caches.match).not.toHaveBeenCalled();
  });

  test('serves a cached static asset without the network', async () => {
    const { scope, dispatch } = createScope();
    const cached = { ok: true, source: 'cache' };
    scope.caches.match.mockResolvedValue(cached);

    const { responded } = await dispatch('fetch', {
      request: request({ path: '/icons/icon-192x192.png' }),
    });

    expect(responded).toBe(cached);
    expect(scope.fetch).not.toHaveBeenCalled();
  });

  test('fetches and caches a static asset missing from the cache', async () => {
    const { scope, cache, dispatch } = createScope();
    const copy = { source: 'copy' };
    const response = {
      ok: true,
      clone: () => {
        return copy;
      },
    };
    scope.fetch.mockResolvedValue(response);
    const assetRequest = request({ path: '/manifest.json' });

    const { responded } = await dispatch('fetch', { request: assetRequest });

    expect(responded).toBe(response);
    expect(cache.put).toHaveBeenCalledWith(assetRequest, copy);
  });

  test('does not cache a failed response', async () => {
    const { scope, cache, dispatch } = createScope();
    const response = { ok: false, status: 404 };
    scope.fetch.mockResolvedValue(response);

    const { responded } = await dispatch('fetch', {
      request: request({ path: '/favicon.ico' }),
    });

    expect(responded).toBe(response);
    expect(cache.put).not.toHaveBeenCalled();
  });
});

describe('push', () => {
  const pushData = (data: unknown) => {
    return {
      json: () => {
        if (typeof data === 'string') {
          throw new SyntaxError('Unexpected token');
        }
        return data;
      },
      text: () => {
        return String(data);
      },
    };
  };

  test('shows the payload as a notification', async () => {
    const { scope, dispatch } = createScope();

    await dispatch('push', {
      data: pushData({
        title: 'BTC crossed $100k',
        body: 'Your alert fired.',
        icon: '/icons/btc.png',
        badge: '/icons/badge.png',
        url: '/my/alerts/1',
        data: { notificationId: 'n1' },
      }),
    });

    expect(scope.registration.showNotification).toHaveBeenCalledWith(
      'BTC crossed $100k',
      {
        body: 'Your alert fired.',
        icon: '/icons/btc.png',
        badge: '/icons/badge.png',
        data: { notificationId: 'n1', url: '/my/alerts/1' },
        requireInteraction: false,
      }
    );
  });

  test('fills a sparse payload from the config', async () => {
    const { scope, dispatch } = createScope({
      search:
        '?defaultTitle=MyHold&defaultBody=Open+MyHold&defaultUrl=/my/notifications&icon=/i.png&badge=/b.png',
    });

    await dispatch('push', { data: pushData({}) });

    expect(scope.registration.showNotification).toHaveBeenCalledWith('MyHold', {
      body: 'Open MyHold',
      icon: '/i.png',
      badge: '/b.png',
      data: { url: '/my/notifications' },
      requireInteraction: false,
    });
  });

  test('shows a plain-text payload as the body', async () => {
    const { scope, dispatch } = createScope({ search: '?defaultTitle=App' });

    await dispatch('push', { data: pushData('Hello') });

    expect(scope.registration.showNotification).toHaveBeenCalledWith(
      'App',
      expect.objectContaining({ body: 'Hello' })
    );
  });

  test('ignores a push without data', async () => {
    const { scope, dispatch } = createScope();

    await dispatch('push', { data: null });

    expect(scope.registration.showNotification).not.toHaveBeenCalled();
  });
});

describe('notificationclick', () => {
  const clickEvent = (data?: { url?: string }) => {
    return { notification: { close: jest.fn(), data } };
  };

  test('navigates and focuses an open window of the app', async () => {
    const { scope, clientsList, dispatch } = createScope();
    const other = {
      url: 'https://other.example.com/',
      focus: jest.fn(),
      navigate: jest.fn(),
    };
    const appWindow = {
      url: `${ORIGIN}/dashboard`,
      focus: jest.fn().mockResolvedValue(undefined),
      navigate: jest.fn().mockResolvedValue(undefined),
    };
    clientsList.push(other, appWindow);
    const event = clickEvent({ url: '/my/alerts/1' });

    await dispatch('notificationclick', event);

    expect(event.notification.close).toHaveBeenCalled();
    expect(appWindow.navigate).toHaveBeenCalledWith('/my/alerts/1');
    expect(appWindow.focus).toHaveBeenCalled();
    expect(other.navigate).not.toHaveBeenCalled();
    expect(scope.clients.openWindow).not.toHaveBeenCalled();
  });

  test('opens the default URL when no window of the app is open', async () => {
    const { scope, dispatch } = createScope({
      search: '?defaultUrl=/notifications',
    });

    await dispatch('notificationclick', clickEvent());

    expect(scope.clients.openWindow).toHaveBeenCalledWith('/notifications');
  });
});
