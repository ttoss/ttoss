import * as React from 'react';

export type PushPermissionState = NotificationPermission | 'unsupported';

/**
 * What the app persists to send pushes later: the browser's endpoint and the
 * keys the server encrypts the payload with.
 */
export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent: string;
};

export type UsePushNotificationsOptions = {
  /**
   * The server's VAPID public key, base64url encoded.
   */
  vapidPublicKey: string | undefined;
  /**
   * Persists a new subscription. A rejection unsubscribes the browser again,
   * so the browser and the server never disagree.
   */
  onSubscribe: (subscription: PushSubscriptionData) => Promise<void>;
  /**
   * Removes a subscription before the browser drops it.
   */
  onUnsubscribe: (subscription: { endpoint: string }) => Promise<void>;
  /**
   * Called with every unexpected error, for error tracking.
   */
  onError?: (error: Error) => void;
  /**
   * Set to `false` where no service worker is registered (local dev), and
   * the hook reports `unsupported`. Defaults to `true`.
   */
  enabled?: boolean;
  /**
   * When `true`, a subscription the browser already holds is handed to
   * `onSubscribe` again on mount, so the app stores it under whoever is
   * signed in now: a browser outlives sessions, and another account may have
   * subscribed it. `isSubscribed` turns `true` only once that resolves.
   * Defaults to `false`.
   */
  syncExisting?: boolean;
};

/**
 * Converts a base64url string (a VAPID public key) to the `Uint8Array`
 * `pushManager.subscribe` expects as `applicationServerKey`.
 */
export const urlBase64ToUint8Array = (
  base64String: string
): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
};

const isPushSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

const readPermission = (): NotificationPermission => {
  return isPushSupported() ? Notification.permission : 'default';
};

const toError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

const toSubscriptionData = (
  subscription: PushSubscription
): PushSubscriptionData => {
  const json = subscription.toJSON();

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    userAgent: navigator.userAgent,
  };
};

/**
 * Asks permission, subscribes the browser and persists the subscription,
 * dropping it again when persisting fails. Resolves whether it subscribed.
 */
const subscribeBrowser = async ({
  vapidPublicKey,
  onSubscribe,
  onPermission,
}: {
  vapidPublicKey: string | undefined;
  onSubscribe: UsePushNotificationsOptions['onSubscribe'];
  onPermission: (permission: NotificationPermission) => void;
}): Promise<boolean> => {
  if (!vapidPublicKey) {
    throw new Error('@ttoss/react-pwa: vapidPublicKey is not configured.');
  }

  const permission = await Notification.requestPermission();
  onPermission(permission);

  if (permission !== 'granted') {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  try {
    await onSubscribe(toSubscriptionData(subscription));
  } catch (persistError) {
    await subscription.unsubscribe();
    throw persistError;
  }

  return true;
};

/**
 * Removes this browser's subscription, from the app first and then from the
 * browser, so a failure leaves both still subscribed. Works outside React:
 * call it before signing out, so a shared browser stops receiving the
 * previous account's pushes. Resolves whether there was one to remove.
 */
export const unsubscribePushNotifications = async ({
  onUnsubscribe,
}: {
  onUnsubscribe: UsePushNotificationsOptions['onUnsubscribe'];
}): Promise<boolean> => {
  if (!isPushSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await onUnsubscribe({ endpoint: subscription.endpoint });
  await subscription.unsubscribe();

  return true;
};

/**
 * Runs one async action at a time, exposing its loading and error state.
 */
const useAsyncAction = ({
  enabled,
  onError,
}: {
  enabled: boolean;
  onError: (error: Error) => void;
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const onErrorRef = React.useRef(onError);

  React.useEffect(() => {
    onErrorRef.current = onError;
  });

  const fail = React.useCallback((cause: unknown) => {
    const failure = toError(cause);
    setError(failure);
    onErrorRef.current(failure);
  }, []);

  const run = React.useCallback(
    async (action: () => Promise<void>) => {
      if (!enabled) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await action();
      } catch (error_) {
        fail(error_);
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, fail]
  );

  return { run, isLoading, error, fail };
};

/**
 * Subscribes and unsubscribes this browser to Web Push through the registered
 * service worker. Persisting the subscription is the app's, through
 * `onSubscribe` and `onUnsubscribe`.
 *
 * A denied permission is reported by `permissionState`, never as `error`.
 */
export const usePushNotifications = ({
  vapidPublicKey,
  onSubscribe,
  onUnsubscribe,
  onError,
  enabled = true,
  syncExisting = false,
}: UsePushNotificationsOptions) => {
  const isSupported = enabled && isPushSupported();

  const [permission, setPermission] =
    React.useState<NotificationPermission>(readPermission);
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const callbacks = React.useRef({ onSubscribe, onUnsubscribe });

  React.useEffect(() => {
    callbacks.current = { onSubscribe, onUnsubscribe };
  });

  const { run, isLoading, error, fail } = useAsyncAction({
    enabled: isSupported,
    onError: (failure) => {
      onError?.(failure);
    },
  });

  React.useEffect(() => {
    if (!isSupported) {
      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        return registration?.pushManager.getSubscription() ?? null;
      })
      .then(async (subscription) => {
        if (subscription && syncExisting) {
          await callbacks.current.onSubscribe(toSubscriptionData(subscription));
        }
        if (!cancelled) {
          setIsSubscribed(!!subscription);
        }
      })
      .catch(fail);

    return () => {
      cancelled = true;
    };
  }, [isSupported, syncExisting, fail]);

  const subscribe = React.useCallback(() => {
    return run(async () => {
      const subscribed = await subscribeBrowser({
        vapidPublicKey,
        onSubscribe: (subscription) => {
          return callbacks.current.onSubscribe(subscription);
        },
        onPermission: setPermission,
      });
      setIsSubscribed(subscribed);
    });
  }, [run, vapidPublicKey]);

  const unsubscribe = React.useCallback(() => {
    return run(async () => {
      await unsubscribePushNotifications({
        onUnsubscribe: (subscription) => {
          return callbacks.current.onUnsubscribe(subscription);
        },
      });
      setIsSubscribed(false);
    });
  }, [run]);

  return {
    isSupported,
    permissionState: (isSupported
      ? permission
      : 'unsupported') as PushPermissionState,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
};
