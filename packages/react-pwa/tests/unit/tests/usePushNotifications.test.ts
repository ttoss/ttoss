import { act, renderHook, waitFor } from '@ttoss/test-utils/react';
import {
  unsubscribePushNotifications,
  urlBase64ToUint8Array,
  usePushNotifications,
} from 'src/index';

// A real P-256 public key, base64url encoded without padding.
const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

const createSubscription = (endpoint = 'https://push.example.com/abc') => {
  return {
    endpoint,
    toJSON: () => {
      return { endpoint, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } };
    },
    unsubscribe: jest.fn().mockResolvedValue(true),
  };
};

type Subscription = ReturnType<typeof createSubscription>;

const mockPushBrowser = ({
  permission = 'default',
  existing = null,
}: {
  permission?: NotificationPermission;
  existing?: Subscription | null;
} = {}) => {
  const pushManager = {
    getSubscription: jest.fn().mockResolvedValue(existing),
    subscribe: jest.fn(),
  };
  const registration = { pushManager };
  const serviceWorker = {
    getRegistration: jest.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  };
  const Notification = {
    permission,
    requestPermission: jest.fn().mockResolvedValue('granted'),
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: serviceWorker,
  });
  Object.defineProperty(window, 'PushManager', {
    configurable: true,
    value: () => {},
  });
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: Notification,
  });

  return { pushManager, serviceWorker, Notification };
};

afterEach(() => {
  // @ts-expect-error -- removing the mocked browser APIs between tests.
  delete navigator.serviceWorker;
  // @ts-expect-error -- removing the mocked browser APIs between tests.
  delete window.PushManager;
  // @ts-expect-error -- removing the mocked browser APIs between tests.
  delete window.Notification;
});

const renderPushHook = (
  options: Partial<Parameters<typeof usePushNotifications>[0]> = {}
) => {
  const onSubscribe = jest.fn().mockResolvedValue(undefined);
  const onUnsubscribe = jest.fn().mockResolvedValue(undefined);
  const onError = jest.fn();

  const hook = renderHook(() => {
    return usePushNotifications({
      vapidPublicKey: VAPID_PUBLIC_KEY,
      onSubscribe,
      onUnsubscribe,
      onError,
      ...options,
    });
  });

  return { ...hook, onSubscribe, onUnsubscribe, onError };
};

test('urlBase64ToUint8Array decodes a VAPID key to its 65 raw bytes', () => {
  const bytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

  expect(bytes).toHaveLength(65);
  // An uncompressed P-256 point starts with 0x04.
  expect(bytes[0]).toBe(4);
});

test('reports unsupported where the browser has no Push API', () => {
  const { result } = renderPushHook();

  expect(result.current.isSupported).toBe(false);
  expect(result.current.permissionState).toBe('unsupported');
});

test('reports unsupported when disabled, even where the browser supports it', async () => {
  const { pushManager } = mockPushBrowser();

  const { result } = renderPushHook({ enabled: false });

  await act(async () => {
    await result.current.subscribe();
    await result.current.unsubscribe();
  });

  expect(result.current.isSupported).toBe(false);
  expect(result.current.permissionState).toBe('unsupported');
  expect(pushManager.subscribe).not.toHaveBeenCalled();
});

test('reads the current permission and an existing subscription', async () => {
  mockPushBrowser({ permission: 'granted', existing: createSubscription() });

  const { result } = renderPushHook();

  expect(result.current.isSupported).toBe(true);
  expect(result.current.permissionState).toBe('granted');
  await waitFor(() => {
    expect(result.current.isSubscribed).toBe(true);
  });
});

test('reports not subscribed when no service worker is registered yet', async () => {
  const { serviceWorker } = mockPushBrowser();
  serviceWorker.getRegistration.mockResolvedValue(undefined);

  const { result } = renderPushHook();

  await waitFor(() => {
    expect(serviceWorker.getRegistration).toHaveBeenCalled();
  });
  expect(result.current.isSubscribed).toBe(false);
});

test('subscribe asks permission, subscribes and hands the subscription to the app', async () => {
  const { pushManager, Notification } = mockPushBrowser();
  const subscription = createSubscription();
  pushManager.subscribe.mockResolvedValue(subscription);

  const { result, onSubscribe, onError } = renderPushHook();

  await act(async () => {
    await result.current.subscribe();
  });

  expect(Notification.requestPermission).toHaveBeenCalled();
  expect(pushManager.subscribe).toHaveBeenCalledWith({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  expect(onSubscribe).toHaveBeenCalledWith({
    endpoint: subscription.endpoint,
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    userAgent: navigator.userAgent,
  });
  expect(result.current.isSubscribed).toBe(true);
  expect(result.current.permissionState).toBe('granted');
  expect(result.current.isLoading).toBe(false);
  expect(onError).not.toHaveBeenCalled();
});

test('a denied permission is a state, not an error', async () => {
  const { pushManager, Notification } = mockPushBrowser();
  Notification.requestPermission.mockResolvedValue('denied');

  const { result, onError } = renderPushHook();

  await act(async () => {
    await result.current.subscribe();
  });

  expect(result.current.permissionState).toBe('denied');
  expect(result.current.error).toBeNull();
  expect(onError).not.toHaveBeenCalled();
  expect(pushManager.subscribe).not.toHaveBeenCalled();
});

test('a missing VAPID key fails before asking permission', async () => {
  const { Notification } = mockPushBrowser();

  const { result, onError } = renderPushHook({ vapidPublicKey: undefined });

  await act(async () => {
    await result.current.subscribe();
  });

  expect(Notification.requestPermission).not.toHaveBeenCalled();
  expect(result.current.error?.message).toMatch(/vapidPublicKey/);
  expect(onError).toHaveBeenCalledWith(result.current.error);
});

test('a subscription the app fails to persist is dropped from the browser', async () => {
  const { pushManager } = mockPushBrowser();
  const subscription = createSubscription();
  pushManager.subscribe.mockResolvedValue(subscription);

  const { result, onSubscribe, onError } = renderPushHook();
  onSubscribe.mockRejectedValue(new Error('500 from the API'));

  await act(async () => {
    await result.current.subscribe();
  });

  expect(subscription.unsubscribe).toHaveBeenCalled();
  expect(result.current.isSubscribed).toBe(false);
  expect(result.current.error?.message).toBe('500 from the API');
  expect(onError).toHaveBeenCalledTimes(1);
});

test('a non-Error rejection is reported as an Error', async () => {
  const { pushManager } = mockPushBrowser();
  pushManager.subscribe.mockRejectedValue('AbortError');

  const { result } = renderPushHook();

  await act(async () => {
    await result.current.subscribe();
  });

  expect(result.current.error).toEqual(new Error('AbortError'));
});

test('unsubscribe tells the app, then drops the browser subscription', async () => {
  const subscription = createSubscription();
  mockPushBrowser({ permission: 'granted', existing: subscription });

  const { result, onUnsubscribe } = renderPushHook();
  await waitFor(() => {
    expect(result.current.isSubscribed).toBe(true);
  });

  await act(async () => {
    await result.current.unsubscribe();
  });

  expect(onUnsubscribe).toHaveBeenCalledWith({
    endpoint: subscription.endpoint,
  });
  expect(subscription.unsubscribe).toHaveBeenCalled();
  expect(result.current.isSubscribed).toBe(false);
});

test('unsubscribe keeps the browser subscription when the app fails to remove it', async () => {
  const subscription = createSubscription();
  mockPushBrowser({ permission: 'granted', existing: subscription });

  const { result, onUnsubscribe } = renderPushHook();
  onUnsubscribe.mockRejectedValue(new Error('offline'));
  await waitFor(() => {
    expect(result.current.isSubscribed).toBe(true);
  });

  await act(async () => {
    await result.current.unsubscribe();
  });

  expect(subscription.unsubscribe).not.toHaveBeenCalled();
  expect(result.current.isSubscribed).toBe(true);
  expect(result.current.error?.message).toBe('offline');
});

test('unsubscribe without a subscription only clears the state', async () => {
  mockPushBrowser({ permission: 'granted' });

  const { result, onUnsubscribe } = renderPushHook();

  await act(async () => {
    await result.current.unsubscribe();
  });

  expect(onUnsubscribe).not.toHaveBeenCalled();
  expect(result.current.isSubscribed).toBe(false);
});

test('a failed subscription lookup is reported', async () => {
  const { serviceWorker } = mockPushBrowser();
  serviceWorker.getRegistration.mockRejectedValue(new Error('SecurityError'));

  const { result, onError } = renderPushHook();

  await waitFor(() => {
    expect(onError).toHaveBeenCalled();
  });
  expect(result.current.error?.message).toBe('SecurityError');
});

test('syncExisting hands an existing subscription to the app again on mount', async () => {
  const subscription = createSubscription();
  mockPushBrowser({ permission: 'granted', existing: subscription });

  const { result, onSubscribe } = renderPushHook({ syncExisting: true });

  await waitFor(() => {
    expect(result.current.isSubscribed).toBe(true);
  });
  expect(onSubscribe).toHaveBeenCalledWith({
    endpoint: subscription.endpoint,
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    userAgent: navigator.userAgent,
  });
});

test('syncExisting reports not subscribed when the app fails to store it', async () => {
  const subscription = createSubscription();
  mockPushBrowser({ permission: 'granted', existing: subscription });
  const onSubscribe = jest.fn().mockRejectedValue(new Error('offline'));

  const { result, onError } = renderPushHook({
    syncExisting: true,
    onSubscribe,
  });

  await waitFor(() => {
    expect(onError).toHaveBeenCalled();
  });
  expect(result.current.isSubscribed).toBe(false);
  expect(result.current.error?.message).toBe('offline');
  // Kept: subscribing again reuses it, and the failure may be transient.
  expect(subscription.unsubscribe).not.toHaveBeenCalled();
});

test('syncExisting stores nothing when the browser holds no subscription', async () => {
  const { pushManager } = mockPushBrowser({ permission: 'granted' });

  const { onSubscribe } = renderPushHook({ syncExisting: true });

  await waitFor(() => {
    expect(pushManager.getSubscription).toHaveBeenCalled();
  });
  expect(onSubscribe).not.toHaveBeenCalled();
});

test('without syncExisting an existing subscription is only read', async () => {
  mockPushBrowser({ permission: 'granted', existing: createSubscription() });

  const { result, onSubscribe } = renderPushHook();

  await waitFor(() => {
    expect(result.current.isSubscribed).toBe(true);
  });
  expect(onSubscribe).not.toHaveBeenCalled();
});

describe('unsubscribePushNotifications', () => {
  test('removes the subscription from the app, then from the browser', async () => {
    const subscription = createSubscription();
    mockPushBrowser({ permission: 'granted', existing: subscription });
    const onUnsubscribe = jest.fn().mockResolvedValue(undefined);

    await expect(unsubscribePushNotifications({ onUnsubscribe })).resolves.toBe(
      true
    );

    expect(onUnsubscribe).toHaveBeenCalledWith({
      endpoint: subscription.endpoint,
    });
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  test('resolves false where the browser has no Push API', async () => {
    const onUnsubscribe = jest.fn();

    await expect(unsubscribePushNotifications({ onUnsubscribe })).resolves.toBe(
      false
    );
    expect(onUnsubscribe).not.toHaveBeenCalled();
  });

  test('resolves false when no service worker is registered', async () => {
    const { serviceWorker } = mockPushBrowser();
    serviceWorker.getRegistration.mockResolvedValue(undefined);
    const onUnsubscribe = jest.fn();

    await expect(unsubscribePushNotifications({ onUnsubscribe })).resolves.toBe(
      false
    );
    expect(onUnsubscribe).not.toHaveBeenCalled();
  });
});
