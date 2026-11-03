/**
 * Mocks the browser's Service Worker and Cache APIs, which jsdom lacks.
 */
export const mockServiceWorkerBrowser = () => {
  const registrations = [
    { unregister: jest.fn().mockResolvedValue(true) },
    { unregister: jest.fn().mockResolvedValue(true) },
  ];
  const serviceWorker = {
    register: jest.fn().mockResolvedValue({ scope: '/' }),
    getRegistrations: jest.fn().mockResolvedValue(registrations),
  };
  const cacheStorage = {
    keys: jest.fn().mockResolvedValue(['app-v1', 'app-v2']),
    delete: jest.fn().mockResolvedValue(true),
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: serviceWorker,
  });
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: cacheStorage,
  });

  return { serviceWorker, registrations, cacheStorage };
};

export const removeServiceWorkerBrowser = () => {
  // @ts-expect-error -- removing the mocked browser API between tests.
  delete navigator.serviceWorker;
  // @ts-expect-error -- removing the mocked browser API between tests.
  delete globalThis.caches;
};
