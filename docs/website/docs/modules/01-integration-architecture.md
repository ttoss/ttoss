---
title: Integration Architecture
sidebar_position: 1
---

# Integration Architecture

One of ttoss's most powerful engineering features is its **context-based architecture** that eliminates repetitive configuration and enables seamless integration across all React packages.

## The Problem We Solved

Traditional component libraries require passing configuration through props at every level:

```tsx
// ❌ Traditional approach - repetitive configuration
<MyForm
  theme={customTheme}
  locale="pt-BR"
  messages={translations}
  onNotify={showNotification}
>
  <Input
    theme={customTheme}
    locale="pt-BR"
    errorMessage={t('errors.required')}
  />
  <Button theme={customTheme} onClick={() => showNotification('Success!')}>
    {t('buttons.submit')}
  </Button>
</MyForm>
```

This approach creates:

- **Prop drilling** through multiple component levels
- **Repetitive code** in every component
- **Tight coupling** between components and applications
- **Difficult maintenance** when changing themes or languages

## The ttoss Solution

**Configure once at the root, integrate automatically everywhere.**

```tsx
// ✅ ttoss approach - configure once
import { ThemeProvider } from '@ttoss/ui';
import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';

function App() {
  return (
    <ThemeProvider theme={bruttalTheme}>
      <I18nProvider locale="pt-BR" messages={translations}>
        <NotificationsProvider>
          {/* All ttoss packages automatically use:
              - Bruttal theme for styling
              - Portuguese translations
              - App notification system */}
          <Auth />
          <Dashboard />
          <UserProfile />
        </NotificationsProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
```

## Foundation Packages

ttoss packages rely on foundation systems that work through React Context. These packages provide core functionality that other packages consume automatically:

### 1. Theme & Styling

**Packages**: `@ttoss/theme`, `@ttoss/ui`, `@ttoss/components`

Components automatically access theme tokens without props:

```tsx
import { Box, Button } from '@ttoss/ui';

export const MyComponent = () => (
  <Box
    sx={{
      padding: '4',
      backgroundColor: 'surface',
      borderColor: 'display.border.muted.default',
    }}
  >
    <Button variant="accent">Click me</Button>
  </Box>
);
```

**No theme prop needed** - components consume the theme from context.

### 2. Internationalization

**Package**: `@ttoss/react-i18n`

Components access translations through hooks:

```tsx
import { useI18n } from '@ttoss/react-i18n';

export const MyComponent = () => {
  const { intl } = useI18n();

  return (
    <h1>
      {intl.formatMessage({
        defaultMessage: 'Welcome',
        description: 'Welcome message',
      })}
    </h1>
  );
};
```

**No message props needed** - translations come from context.

### 3. Notifications

**Package**: `@ttoss/react-notifications`

Components trigger notifications through hooks:

```tsx
import { useNotifications } from '@ttoss/react-notifications';
import { NotificationsBox } from '@ttoss/react-notifications';

export const MyComponent = () => {
  const { notify, setLoading } = useNotifications();

  const handleAction = async () => {
    setLoading(true);
    try {
      await saveData();
      notify({ type: 'success', message: 'Saved!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NotificationsBox />
      <button onClick={handleAction}>Save</button>
    </>
  );
};
```

**No notification props needed** - notification system comes from context.

### Additional Foundation Packages

The foundation layer continues to grow:

- **`@ttoss/forms`**: Form management with validation, leveraging theme and i18n
- **`@ttoss/react-icons`**: Icon system integrated with themes
- **More to come**: As the ecosystem evolves, new foundation packages extend the capabilities

All foundation packages follow the same principle: **configure once, integrate everywhere**.

## Real-World Example: Authentication

The `@ttoss/react-auth-core` package demonstrates this pattern perfectly:

```tsx
// Package implementation
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

export const AuthSignIn = ({ onSignIn }) => {
  const { intl } = useI18n();
  const { isLoading } = useNotifications();

  return (
    <Box sx={{ padding: '8', backgroundColor: 'surface' }}>
      <h2>{intl.formatMessage({ defaultMessage: 'Sign in' })}</h2>
      <Button disabled={isLoading}>
        {intl.formatMessage({ defaultMessage: 'Sign in' })}
      </Button>
    </Box>
  );
};
```

Notice:

- ✅ Uses `useI18n()` hook - no message props
- ✅ Uses `sx` prop with tokens - no style props
- ✅ Uses `useNotifications()` hook - no loading props

## Key Benefits

### 1. Zero Configuration for Packages

Each ttoss package works immediately once you set up root providers:

```tsx
// Just wrap your app once
<ThemeProvider theme={theme}>
  <I18nProvider locale={locale}>
    <NotificationsProvider>
      {/* Every ttoss package now works perfectly */}
      <Auth />
      <Forms />
      <Dashboard />
    </NotificationsProvider>
  </I18nProvider>
</ThemeProvider>
```

### 2. Flexible Customization

Change everything from one place:

```tsx
// Switch from English to Portuguese
<I18nProvider locale="pt-BR" messages={ptBR}>

// Switch from Bruttal to Oca theme
<ThemeProvider theme={ocaTheme}>

// Custom notification behavior
<NotificationsProvider duration={5000} position="top-right">
```

### 3. Clean Component APIs

Components have minimal, focused props:

```tsx
// Only business logic props - no UI configuration
<Auth
  onSignIn={handleSignIn}
  onSignUp={handleSignUp}
  // No theme, locale, or notification props! 🎉
/>
```

### 4. Consistent User Experience

All components automatically share:

- Visual design (same theme)
- Language (same translations)
- Feedback patterns (same notifications)

### 5. Easy Testing

Mock contexts once for all tests:

```tsx
const AllProviders = ({ children }) => (
  <ThemeProvider>
    <I18nProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </I18nProvider>
  </ThemeProvider>
);

render(<MyComponent />, { wrapper: AllProviders });
```

## Package Development Guidelines

When creating ttoss packages:

### ✅ DO: Use Foundation Packages

```tsx
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

// Components automatically integrate with the app
```

### ✅ DO: Declare as Peer Dependencies

```json
{
  "peerDependencies": {
    "@ttoss/ui": "workspace:^",
    "@ttoss/react-i18n": "workspace:^",
    "@ttoss/react-notifications": "workspace:^"
  }
}
```

### ❌ DON'T: Require Configuration Props

```tsx
// ❌ Bad - requires configuration
type Props = {
  theme: Theme;
  locale: string;
  onNotify: (msg: string) => void;
};

// ✅ Good - uses context
const Component = () => {
  const { intl } = useI18n();
  const { notify } = useNotifications();
  // ...
};
```

## Migration from Other Libraries

Switching to ttoss is straightforward:

```tsx
// Before (traditional library)
<Form theme={theme} locale="en">
  <Input
    label={t('email')}
    errorMessage={t('errors.required')}
  />
</Form>

// After (ttoss)
<Form>
  <FormFieldInput
    label={intl.formatMessage({ defaultMessage: 'Email' })}
  />
</Form>
```

Just wrap your app with providers once, and all components work seamlessly.

## Learn More

- **[Modules Overview](/docs/modules/packages)**: Browse all available packages
- **[Getting Started](/docs/design/getting-started)**: Set up providers in your app
- **[Design Tokens](/docs/design/design-system/design-tokens)**: Understand theme tokens
- **[Components](https://storybook.ttoss.dev)**: Browse available components
- **[Engineering Technologies](/docs/engineering/technologies)**: Understand the tech stack

This context-based architecture is an engineering innovation that makes ttoss packages **truly modular and effortlessly integrated**.
