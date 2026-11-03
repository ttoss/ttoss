import {
  buildServiceWorkerUrl,
  isLocalhostHostname,
  parseServiceWorkerConfig,
  registerServiceWorker,
  unregisterServiceWorkers,
} from 'src/index';

import {
  mockServiceWorkerBrowser,
  removeServiceWorkerBrowser,
} from './mockServiceWorkerBrowser';

// jsdom serves the tests from http://localhost.

afterEach(removeServiceWorkerBrowser);

test.each(['localhost', '127.0.0.1', '::1', '[::1]'])(
  '%s is localhost',
  (hostname) => {
    expect(isLocalhostHostname(hostname)).toBe(true);
  }
);

test('a deployed hostname is not localhost', () => {
  expect(isLocalhostHostname('myhold.app')).toBe(false);
});

describe('buildServiceWorkerUrl', () => {
  test('returns the bare URL without config', () => {
    expect(buildServiceWorkerUrl()).toBe('/sw.js');
  });

  test('carries the config the worker parses back', () => {
    const url = buildServiceWorkerUrl({
      config: { cacheName: 'oca-v1', defaultUrl: '/notifications' },
    });

    const config = parseServiceWorkerConfig(new URL(url, 'https://x').search);

    expect(url.startsWith('/sw.js?')).toBe(true);
    expect(config.cacheName).toBe('oca-v1');
    expect(config.defaultUrl).toBe('/notifications');
  });

  test('appends to a URL that already has a query', () => {
    expect(
      buildServiceWorkerUrl({ url: '/sw.js?v=2', config: { cacheName: 'a' } })
    ).toBe('/sw.js?v=2&cacheName=a');
  });
});

describe('registerServiceWorker on localhost', () => {
  test('does nothing where service workers are unsupported', async () => {
    await expect(registerServiceWorker()).resolves.toBeNull();
  });

  test('cleans up instead of registering', async () => {
    const { serviceWorker, registrations, cacheStorage } =
      mockServiceWorkerBrowser();

    await expect(registerServiceWorker()).resolves.toBeNull();

    expect(serviceWorker.register).not.toHaveBeenCalled();
    for (const registration of registrations) {
      expect(registration.unregister).toHaveBeenCalled();
    }
    expect(cacheStorage.delete.mock.calls).toEqual([['app-v1'], ['app-v2']]);
  });

  test('enabled overrides the hostname check', async () => {
    const { serviceWorker } = mockServiceWorkerBrowser();

    await registerServiceWorker({ enabled: true, url: '/worker.js' });

    expect(serviceWorker.register).toHaveBeenCalledWith('/worker.js');
  });
});

describe('unregisterServiceWorkers', () => {
  test('does nothing where service workers are unsupported', async () => {
    await expect(unregisterServiceWorkers()).resolves.toBeUndefined();
  });

  test('unregisters without the Cache API', async () => {
    const { registrations } = mockServiceWorkerBrowser();
    // @ts-expect-error -- simulating a browser without the Cache API.
    delete globalThis.caches;

    await unregisterServiceWorkers();

    expect(registrations[1].unregister).toHaveBeenCalled();
  });
});
