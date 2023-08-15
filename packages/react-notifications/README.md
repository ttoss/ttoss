# @ttoss/react-notifications

## About

This module handles notifications in your applications and other ttoss modules.

## Getting Started

### Install

```shell
pnpm add @ttoss/notifications @ttoss/ui @ttoss/react-icons @emotion/react
```

## Usage

### Provider

Add a provider on top of your application.

```tsx
import { NotificationsProvider } from '@ttoss/react-notifications';
import { ThemeProvider } from "@ttoss/ui";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
```

### Loading

This modules provides a global loading bar that you can use on every part of your App.

```tsx
import { useNotifications } from '@ttoss/react-notifications';

const Component = () => {
  const { loading, setLoading } = useNotifications();

  return (
    <div>
      <button onClick={() => setLoading(true)} disabled={isLoading}>
        Click Me!
      </button>
    </div>
  );
};
```

### Modal

This modules loads your notification in a Modal. Just put a container under a `NotificationsProvider` and you are ready to go.

```tsx
import { useNotifications } from '@ttoss/react-notifications';

const Component = () => {
  const { setNotifications } = useNotifications();

  return (
    <div>
      <button
        onClick={() =>
          setNotifications({ message: "I'm a notification", type: 'info' })
        }
      >
        Click Me!
      </button>
      <NotificationsModal />
    </div>
  );
};
```

### Resolving notifications

Additionally, the API accepts a third property in `setNotifications`: `notificationKey`.
In this property, you can insert a placeholder for a particular notification, and, the library gonna resolve any repetated key for this notification to be only one notification.

In that way, you have more control if you gonna render a repeated notification or not:

```tsx
import { useNotifications } from '@ttoss/react-notifications';

const Component = () => {
  const { setNotifications } = useNotifications();

  return (
    <div>
      <button
        onClick={() =>
          setNotifications([
            {
              message: "I'm a notification",
              type: 'info',
              key: 'information',
            },
            {
              message: "I'm considered to be the same notification",
              type: 'info',
              key: 'information',
            },
          ])
        }
      >
        Click Me!
      </button>
      <NotificationsModal />
    </div>
  );
};
```
