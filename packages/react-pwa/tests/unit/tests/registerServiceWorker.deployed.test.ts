/**
 * @jest-environment-options {"url": "https://app.oneclickads.com/"}
 */
import { registerServiceWorker } from 'src/index';

import {
  mockServiceWorkerBrowser,
  removeServiceWorkerBrowser,
} from './mockServiceWorkerBrowser';

afterEach(removeServiceWorkerBrowser);

test('registers with the config on a deployed hostname', async () => {
  const { serviceWorker } = mockServiceWorkerBrowser();

  const registration = await registerServiceWorker({
    config: { cacheName: 'oca-v1' },
  });

  expect(registration).toEqual({ scope: '/' });
  expect(serviceWorker.register).toHaveBeenCalledWith(
    '/sw.js?cacheName=oca-v1'
  );
});

test('enabled false cleans up on a deployed hostname', async () => {
  const { serviceWorker, registrations } = mockServiceWorkerBrowser();

  await registerServiceWorker({ enabled: false });

  expect(serviceWorker.register).not.toHaveBeenCalled();
  expect(registrations[0].unregister).toHaveBeenCalled();
});
