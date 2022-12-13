# @ttoss/notifications

## About

This module handles notifications in your applications and other ttoss modules.

## Getting Started

### Install

```shell
yarn add @ttoss/{notifications,ui}
```

## Usage

### Provider

Add a provider on top of your application.

```tsx
import { NotificationsProvider } from '@ttoss/notifications';
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
import { useNotifications } from '@ttoss/notifications';

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
