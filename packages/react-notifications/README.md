# @ttoss/react-notifications

## About

This module provides a simple way to show notifications in your application using ttoss ecosystem.

## Installation

```shell
pnpm add @ttoss/notifications @ttoss/components @ttoss/react-icons @ttoss/ui @emotion/react
```

## Getting Started

### Provider

Add a provider on top of your application and set [Modal app element](https://reactcommunity.org/react-modal/accessibility/).

```tsx
import { NotificationsProvider } from '@ttoss/react-notifications';
import { ThemeProvider } from '@ttoss/ui';
import { Modal } from '@ttoss/components';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

Modal.setAppElement('#root');
```

### Loading

This modules provides a global loading bar that you can use on every part of your App.

```tsx
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Component = () => {
  const { isLoading, setLoading } = useNotifications();

  return (
    <Box>
      <Button onClick={() => setLoading(true)} disabled={isLoading}>
        Click Me!
      </Button>
    </Box>
  );
};
```

### Modal

Set `viewType` to `modal` to show a modal notification.

```tsx
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Component = () => {
  const { addNotification } = useNotifications();

  return (
    <Box>
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a notification",
            type: 'info',
            viewType: 'modal',
          })
        }
      >
        Click Me!
      </Button>
    </Box>
  );
};
```

### Toast

Set `viewType` to `toast` to show a toast notification.

```tsx
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Component = () => {
  const { addNotification } = useNotifications();

  return (
    <Box>
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a notification",
            type: 'info',
            viewType: 'toast',
          })
        }
      >
        Click Me!
      </Button>
    </Box>
  );
};
```

### NotificationsBox

You can use `NotificationsBox` to show the notifications in a specific place. You can render as many `NotificationsBox` as you want in your application.

```tsx
import { NotificationsBox } from '@ttoss/react-notifications';
import { Box } from '@ttoss/ui';

const Component = () => {
  return (
    <Box>
      <NotificationsBox />
    </Box>
  );
};

const App = () => {
  return (
    <Box>
      <NotificationsBox />
      <Component />
    </Box>
  );
};
```

In the example above, both `NotificationsBox` will show the notifications.

To render the notifications in a specific `NotificationsBox`, you can set the `boxId` in the notification, which is the `id` of the `NotificationsBox` you want to show the notification.

```tsx
import { useNotifications, NotificationsBox } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Component = () => {
  const { addNotification } = useNotifications();

  return (
    <Box>
      <NotificationsBox id="my-box" />
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a notification",
            type: 'info',
            boxId: 'my-box',
          })
        }
      >
        Click Me!
      </Button>
    </Box>
  );
};
```

### NotificationsHeader

You can use `NotificationsHeader` to display notifications with `viewType: 'header'` in a specific place, such as your application's header. Only notifications with `viewType: 'header'` will be shown by this component.

```tsx
import {
  NotificationsHeader,
  useNotifications,
} from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Header = () => {
  const { addNotification } = useNotifications();

  return (
    <Box>
      <NotificationsHeader />
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a header notification",
            type: 'info',
            viewType: 'header',
          })
        }
      >
        Show Header Notification
      </Button>
    </Box>
  );
};
```

### Persistent Notifications

You can create persistent notifications that will not be removed when `clearNotifications()` is called by setting the `persist` property to `true`. This is useful for important notifications that should remain visible until manually dismissed.

```tsx
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Component = () => {
  const { addNotification, clearNotifications } = useNotifications();

  return (
    <Box>
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a persistent notification",
            type: 'warning',
            persist: true, // This notification will not be cleared by clearNotifications()
          })
        }
      >
        Add Persistent Notification
      </Button>
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a regular notification",
            type: 'info',
            persist: false, // This notification will be cleared by clearNotifications()
          })
        }
      >
        Add Regular Notification
      </Button>
      <Button onClick={clearNotifications}>
        Clear All Non-Persistent Notifications
      </Button>
    </Box>
  );
};
```

#### Recommendation

"You can place the `NotificationsBox` component at the root of your application to handle notifications rendering automatically, eliminating the need to manage it manually elsewhere. If you need a specific `NotificationsBox`, simply render the `NotificationsBox` in the desired location and use the `boxId` property to differentiate it."

## API

### Notification Properties

| Property   | Type                                          | Default        | Description                                                                   |
| ---------- | --------------------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| `id`       | `string \| number`                            | Auto-generated | Unique identifier for the notification                                        |
| `title`    | `string`                                      | -              | Optional title for the notification                                           |
| `message`  | `string`                                      | **Required**   | The notification message content                                              |
| `type`     | `'warning' \| 'error' \| 'info' \| 'success'` | **Required**   | The type of notification                                                      |
| `viewType` | `'toast' \| 'modal' \| 'box' \| 'header'`     | `'box'`        | Where the notification should be displayed                                    |
| `toast`    | `ToastOptions`                                | -              | Additional options for toast notifications                                    |
| `boxId`    | `string \| number`                            | -              | ID of the specific NotificationsBox to display the notification               |
| `persist`  | `boolean`                                     | `false`        | Whether the notification should persist when `clearNotifications()` is called |

### useNotifications Hook

The `useNotifications` hook returns an object with the following properties:

| Property             | Type                                                     | Description                                        |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `notifications`      | `Notification[]`                                         | Array of current notifications                     |
| `addNotification`    | `(notification: Notification \| Notification[]) => void` | Function to add one or more notifications          |
| `removeNotification` | `(id: string \| number) => void`                         | Function to remove a specific notification by ID   |
| `clearNotifications` | `() => void`                                             | Function to clear all non-persistent notifications |
| `isLoading`          | `boolean`                                                | Current loading state                              |
| `setLoading`         | `(loading: boolean) => void`                             | Function to set the loading state                  |
| `defaultViewType`    | `'toast' \| 'modal' \| 'box' \| 'header'`                | The default view type for notifications            |

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
