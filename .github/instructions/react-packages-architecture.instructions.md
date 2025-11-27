---
description: Architecture and integration patterns for React packages in the ttoss monorepo
applyTo: '**/*.tsx'
---

# React Packages Architecture and Integration Pattern

This document describes the foundational architecture pattern used across all React packages in the ttoss monorepo. This pattern enables applications to configure UI, i18n, and notifications **once at the root level**, and have all ttoss packages automatically inherit these configurations without requiring component-level props.

## Core Philosophy

**Applications configure once, packages adapt automatically.**

Instead of passing styles, translations, and notification handlers as props to every component, ttoss packages rely on context providers that applications set up at their root level. This creates a consistent, centralized configuration approach.

## Foundation Packages

These packages define the standards that all other React packages must follow. The foundation layer includes:

### 1. Theme & UI System

**Packages**: `@ttoss/theme`, `@ttoss/ui`, `@ttoss/react-icons`, `@ttoss/components`

**Purpose**: Define design tokens, components, and styling standards.

**How it works**:

- `@ttoss/theme`: Provides theme objects with design tokens (colors, spacing, typography, etc.)
- `@ttoss/ui`: Core UI components (Box, Button, Flex, Text, etc.) that consume theme tokens
- `@ttoss/react-icons`: Icon system integrated with themes
- `@ttoss/components`: Higher-level composed components

**Usage in packages**:

```typescript
import { Box, Button, Flex, Heading } from '@ttoss/ui';

// Components automatically use theme tokens via sx prop
<Box
  sx={{
    maxWidth: '400px',
    border: 'md',
    borderColor: 'display.border.muted.default',
    paddingX: '8',
    paddingY: '9',
    backgroundColor: 'surface',
  }}
>
  <Button variant="accent">Click me</Button>
</Box>
```

**Application setup** (done once at root):

```typescript
import { ThemeProvider } from '@ttoss/ui';
import { bruttalTheme } from '@ttoss/theme/Bruttal';

function App() {
  return (
    <ThemeProvider theme={bruttalTheme}>
      {/* All ttoss components now use Bruttal theme */}
    </ThemeProvider>
  );
}
```

### 2. Internationalization (i18n)

**Package**: `@ttoss/react-i18n`

**Purpose**: Define translation and localization standards.

**How it works**:

- Uses `react-intl` under the hood
- Packages define messages using `defineMessages` with English defaults
- Applications provide translations via the I18nProvider

**Usage in packages**:

```typescript
import { useI18n } from '@ttoss/react-i18n';

const { intl } = useI18n();

const label = intl.formatMessage({
  description: 'Email label.',
  defaultMessage: 'Email',
});
```

**Application setup** (done once at root):

```typescript
import { I18nProvider } from '@ttoss/react-i18n';
import ptBR from './i18n/pt-BR.json';
import enUS from './i18n/en-US.json';

function App() {
  return (
    <I18nProvider locale="pt-BR" messages={{ 'pt-BR': ptBR, 'en-US': enUS }}>
      {/* All ttoss packages now use Portuguese translations */}
    </I18nProvider>
  );
}
```

### 3. Notifications

**Package**: `@ttoss/react-notifications`

**Purpose**: Define how packages display notifications, loading states, and errors.

**How it works**:

- Provides hooks (`useNotifications`) to trigger notifications
- Provides components (`NotificationsBox`) to display notifications
- Applications configure notification behavior via NotificationsProvider

**Usage in packages**:

```typescript
import { useNotifications } from '@ttoss/react-notifications';
import { NotificationsBox } from '@ttoss/react-notifications';

function MyComponent() {
  const { setLoading, notify } = useNotifications();

  const handleAction = async () => {
    setLoading(true);
    try {
      await someAsyncAction();
      notify({ type: 'success', message: 'Action completed!' });
    } catch (error) {
      notify({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NotificationsBox />
      <button onClick={handleAction}>Do something</button>
    </div>
  );
}
```

**Application setup** (done once at root):

```typescript
import { NotificationsProvider } from '@ttoss/react-notifications';

function App() {
  return (
    <NotificationsProvider>
      {/* All ttoss packages can now trigger notifications */}
    </NotificationsProvider>
  );
}
```

### Additional Foundation Packages

The foundation layer continues to grow and may include:

- **`@ttoss/forms`**: Form management with validation, leveraging theme and i18n
- **`@ttoss/react-icons`**: Icon system integrated with themes
- **Future packages**: As the ecosystem evolves, new foundation packages may be added

**All foundation packages follow the same principle**: Applications configure once at the root, packages consume via context.

## Real-World Example: @ttoss/react-auth-core

Let's examine how `@ttoss/react-auth-core` demonstrates this pattern:

### Package Dependencies (from package.json)

```json
{
  "peerDependencies": {
    "@ttoss/components": "workspace:^",
    "@ttoss/forms": "workspace:^",
    "@ttoss/react-i18n": "workspace:^",
    "@ttoss/react-notifications": "workspace:^",
    "@ttoss/ui": "workspace:^",
    "react": ">=16.8.0"
  }
}
```

Notice: **NO** style props, theme props, or message props in dependencies.

### Component Implementation (AuthCard.tsx)

```typescript
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button, Flex, Heading } from '@ttoss/ui';

export const AuthCard = ({ children, title, buttonLabel, isValidForm }) => {
  // Uses notifications context - no props needed
  const { isLoading } = useNotifications();

  return (
    <Box
      sx={{
        // Uses theme tokens - no inline styles or theme props
        maxWidth: '400px',
        border: 'md',
        borderColor: 'display.border.muted.default',
        paddingX: '8',
        paddingY: '9',
        backgroundColor: 'surface',
      }}
    >
      <Heading as="h2" variant="h2" sx={{ marginBottom: '8' }}>
        {title}
      </Heading>
      {children}
      <Button
        type="submit"
        variant="accent"
        disabled={isLoading || !isValidForm}
        loading={isLoading}
      >
        {buttonLabel}
      </Button>
    </Box>
  );
};
```

### Component Implementation (AuthSignIn.tsx)

```typescript
import { useI18n } from '@ttoss/react-i18n';
import { NotificationsBox } from '@ttoss/react-notifications';
import { Button, Flex, Link, Text } from '@ttoss/ui';

export const AuthSignIn = ({ onSignIn, onGoToSignUp }) => {
  // Uses i18n context - no message props needed
  const { intl } = useI18n();

  const schema = yup.object().shape({
    email: yup
      .string()
      .required(
        intl.formatMessage({
          description: 'Email is a required field.',
          defaultMessage: 'Enter your email address',
        })
      ),
  });

  return (
    <Form onSubmit={onSignIn}>
      <AuthCard
        title={intl.formatMessage({ defaultMessage: 'Sign in' })}
        buttonLabel={intl.formatMessage({ defaultMessage: 'Sign in' })}
      >
        <FormFieldInput
          name="email"
          label={intl.formatMessage({ defaultMessage: 'Email' })}
        />
        {/* Notifications display automatically */}
        <NotificationsBox />
      </AuthCard>
    </Form>
  );
};
```

### Application Usage

Applications only need to set up providers **once**:

```typescript
import { ThemeProvider } from '@ttoss/ui';
import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { Auth } from '@ttoss/react-auth-core';
import { bruttalTheme } from '@ttoss/theme/Bruttal';
import ptBR from './i18n/pt-BR.json';

function App() {
  return (
    <ThemeProvider theme={bruttalTheme}>
      <I18nProvider locale="pt-BR" messages={{ 'pt-BR': ptBR }}>
        <NotificationsProvider>
          {/* Auth components automatically use:
              - Bruttal theme for styling
              - Portuguese translations
              - App notification system */}
          <Auth onSignIn={handleSignIn} />
        </NotificationsProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
```

## Guidelines for Package Development

When creating or modifying React packages in ttoss:

### ✅ DO: Use Context-Based Dependencies

```typescript
// ✅ CORRECT: Use hooks to access context
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';
import { Box, Button } from '@ttoss/ui';

function MyComponent() {
  const { intl } = useI18n();
  const { notify } = useNotifications();

  return (
    <Box sx={{ padding: '4', backgroundColor: 'surface' }}>
      <Button onClick={() => notify({ message: 'Success!' })}>
        {intl.formatMessage({ defaultMessage: 'Click me' })}
      </Button>
    </Box>
  );
}
```

### ❌ DON'T: Use Props for Styling, Messages, or Notifications

```typescript
// ❌ WRONG: Don't require style props
type MyComponentProps = {
  backgroundColor?: string;
  padding?: number;
  buttonText?: string;
  onNotify?: (message: string) => void;
};

function MyComponent({ backgroundColor, padding, buttonText, onNotify }) {
  return (
    <div style={{ backgroundColor, padding }}>
      <button onClick={() => onNotify?.('Success!')}>
        {buttonText}
      </button>
    </div>
  );
}
```

### ✅ DO: Define i18n Messages with defineMessages

```typescript
// ✅ CORRECT: Define messages for extraction
import { defineMessages, useI18n } from '@ttoss/react-i18n';

const messages = defineMessages({
  title: {
    defaultMessage: 'Welcome',
    description: 'Welcome message shown on homepage',
  },
  buttonLabel: {
    defaultMessage: 'Get started',
    description: 'Label for the main CTA button',
  },
});

function MyComponent() {
  const { intl } = useI18n();
  return (
    <div>
      <h1>{intl.formatMessage(messages.title)}</h1>
      <button>{intl.formatMessage(messages.buttonLabel)}</button>
    </div>
  );
}
```

### ✅ DO: Use Theme Tokens via sx Prop

```typescript
// ✅ CORRECT: Use theme tokens from @ttoss/ui
import { Box, Flex, Text } from '@ttoss/ui';

function MyComponent() {
  return (
    <Box
      sx={{
        // Spacing tokens
        padding: '4',
        marginBottom: '6',
        // Color tokens
        backgroundColor: 'surface',
        borderColor: 'display.border.muted.default',
        // Border tokens
        border: 'md',
        // Size tokens
        maxWidth: '400px',
      }}
    >
      <Text sx={{ color: 'text.primary' }}>Content</Text>
    </Box>
  );
}
```

### ✅ DO: Declare Foundation Packages as peerDependencies

```json
{
  "peerDependencies": {
    "@ttoss/ui": "workspace:^",
    "@ttoss/react-i18n": "workspace:^",
    "@ttoss/react-notifications": "workspace:^",
    "react": ">=16.8.0"
  }
}
```

This ensures:

- Applications provide the context providers
- No duplicate installations of foundation packages
- Version consistency across the monorepo

## Benefits of This Pattern

1. **Centralized Configuration**: Applications configure theme, locale, and notifications once
2. **Consistency**: All packages use the same design system, i18n, and notification patterns
3. **Flexibility**: Applications can switch themes, languages, or notification styles without touching package code
4. **Developer Experience**: Package developers don't manage styling, translations, or notifications manually
5. **Reduced Props**: Components have cleaner APIs without style/message props
6. **Type Safety**: TypeScript ensures proper context usage

## Testing Packages with This Pattern

When testing components that use contexts:

```typescript
import { render } from '@ttoss/test-utils';
import { I18nProvider } from '@ttoss/react-i18n';
import { NotificationsProvider } from '@ttoss/react-notifications';
import { ThemeProvider } from '@ttoss/ui';

// Wrapper with all required providers
const AllTheProviders = ({ children }) => (
  <ThemeProvider>
    <I18nProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </I18nProvider>
  </ThemeProvider>
);

test('component works', () => {
  render(<MyComponent />, { wrapper: AllTheProviders });
  // Test as usual
});
```

## Summary

When developing React packages in ttoss:

1. **Never** require style, theme, translation, or notification props
2. **Always** use `@ttoss/ui` components and `sx` prop for styling
3. **Always** use `useI18n()` and `defineMessages` for text content
4. **Always** use `useNotifications()` for user feedback
5. **Always** declare foundation packages as `peerDependencies`
6. **Trust** that applications will provide the necessary context providers

This pattern creates a cohesive ecosystem where packages "just work" once applications set up their root providers.
