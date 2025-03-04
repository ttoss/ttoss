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
import { ThemeProvider } from "@ttoss/ui";
import { Modal } from "@ttoss/components";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')

Modal.setAppElement('#root');
```

### Loading

This modules provides a global loading bar that you can use on every part of your App.

```tsx
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

const Component = () => {
  const { loading, setLoading } = useNotifications();

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
  const { addNotification , NotificationsBox } = useNotifications();

  return (
    <Box>
      <NotificationsBox id="my-box" />
      <Button
        onClick={() =>
          addNotification({
            message: "I'm a notification",
            type: 'info',,
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

#### Recommendation

"You can place the `NotificationsBox` component at the root of your application to handle notifications rendering automatically, eliminating the need to manage it manually elsewhere. If you need a specific `NotificationsBox`, simply render the `NotificationsBox` in the desired location and use the `boxId` property to differentiate it."

## License

[MIT](https://github.com/ttoss/ttoss/blob/main/LICENSE)
