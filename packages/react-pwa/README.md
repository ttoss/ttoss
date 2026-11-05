# @ttoss/react-pwa

Progressive Web App building blocks for React apps: a prebuilt service worker, its registration, and a hook that subscribes the browser to Web Push. It works with any bundler or framework (Vite, Next.js) because the service worker ships as a ready file and every app-specific value travels in its registration URL.

The package owns the browser half. The manifest and icons stay in the app, and so does persisting subscriptions and sending pushes, which the app's server does with [`web-push`](https://www.npmjs.com/package/web-push).

## Installation

```bash
pnpm add @ttoss/react-pwa
```

## Serve the service worker

A service worker controls only the pages under its own path, so `sw.js` must be served from the origin root. Copy it into the public folder before each build:

```json
{
  "scripts": {
    "prebuild": "cp node_modules/@ttoss/react-pwa/dist/sw.js public/sw.js",
    "predev": "pnpm run prebuild"
  }
}
```

Add `public/sw.js` to `.gitignore`, and link the manifest from the HTML with `<link rel="manifest" href="/manifest.json" />`.

## Register it

Call `registerServiceWorker` once, at the app root. Outside localhost it registers `/sw.js`; on localhost, or wherever `enabled` is `false`, it unregisters every worker and deletes every cache instead, so a dev server never serves assets from an old build.

```tsx
import { registerServiceWorker } from '@ttoss/react-pwa';

React.useEffect(() => {
  registerServiceWorker({
    enabled: import.meta.env.PROD,
    config: {
      cacheName: 'my-app-v1',
      precache: ['/manifest.json', '/icons/icon-192x192.png'],
      defaultTitle: 'My App',
      defaultUrl: '/notifications',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
    },
  }).catch(onError);
}, []);
```

The worker caches only what it is told to. Same-origin GET requests under `cachePaths` (by default `/icons/`, `/manifest.json` and `/favicon.ico`) are served cache-first; everything else, navigations and hashed bundles included, goes to the network untouched, so a deploy is visible on the next load. Changing `cacheName` drops every entry of the previous name on activation.

| Config          | Default                                         | What it does                                |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| `cacheName`     | `ttoss-pwa-v1`                                  | Cache to use; other names are deleted       |
| `precache`      | `[]`                                            | Paths cached on install                     |
| `cachePaths`    | `['/icons/', '/manifest.json', '/favicon.ico']` | Path prefixes served cache-first            |
| `defaultTitle`  | `Notification`                                  | Title of a push without one                 |
| `defaultBody`   | `You have a new notification.`                  | Body of a push without one                  |
| `defaultUrl`    | `/`                                             | URL opened by clicking a push without `url` |
| `icon`, `badge` | none                                            | Icon and badge of a push without them       |

Lists travel comma-separated, so a path cannot contain a comma.

## Push notifications

`usePushNotifications` asks for permission, subscribes through the registered worker and hands the subscription to the app to persist. When `onSubscribe` rejects, the hook drops the browser subscription again, so the browser and the server never disagree. A denied permission shows in `permissionState`; `error` holds only unexpected failures, which `onError` also receives.

```tsx
import { usePushNotifications } from '@ttoss/react-pwa';

const PushToggle = () => {
  const {
    isSupported,
    permissionState,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications({
    vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    enabled: import.meta.env.PROD,
    onSubscribe: (subscription) => {
      return api.post('/push-subscriptions', subscription);
    },
    onUnsubscribe: ({ endpoint }) => {
      return api.delete('/push-subscriptions', { endpoint });
    },
    onError: captureException,
  });

  if (!isSupported || permissionState === 'denied') {
    return null;
  }

  return (
    <button
      disabled={isLoading}
      onClick={isSubscribed ? unsubscribe : subscribe}
    >
      {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
    </button>
  );
};
```

Pass the same `enabled` as the registration: where no worker is registered the hook reports `unsupported`. On iOS, Web Push works only once the app is added to the home screen (iOS 16.4 and later).

### A browser shared by several accounts

A browser subscription outlives the session that created it. When several accounts can sign in on one browser, handle both ends:

- Pass `syncExisting: true`, so on mount the hook hands a subscription the browser already holds to `onSubscribe` again. An `onSubscribe` that upserts on `endpoint` then moves it to whoever is signed in now. `isSubscribed` turns `true` only once that resolves.
- Call `unsubscribePushNotifications` before signing out, so the browser stops receiving the previous account's pushes. It works outside React and resolves `false` when there was nothing to remove.

```ts
import { unsubscribePushNotifications } from '@ttoss/react-pwa';

const signOutEverywhere = async () => {
  await unsubscribePushNotifications({
    onUnsubscribe: ({ endpoint }) => {
      return api.delete('/push-subscriptions', { endpoint });
    },
  });
  await signOut();
};
```

The server sends a JSON payload, and every field is optional:

```ts
await webpush.sendNotification(
  subscription,
  JSON.stringify({
    title: 'BTC crossed $100k',
    body: 'Your alert fired.',
    url: '/alerts/1',
    data: { notificationId: 'n1' },
  })
);
```

Clicking the notification navigates an open window of the app to `url` and focuses it, or opens a new one.

## Custom service worker

To add listeners of your own, bundle a worker that calls `createServiceWorker(self)` and register that file with `registerServiceWorker({ url })`. The listeners it wires are the same ones `sw.js` ships.
