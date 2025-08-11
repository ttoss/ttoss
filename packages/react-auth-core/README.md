# @ttoss/react-auth-core

Core authentication components and abstractions for React applications. This package provides UI components and screen-based authentication flows that work with any authentication provider.

## Features

- Screen-based authentication flow management
- Flexible authentication UI components
- Authentication context and provider
- Type-safe authentication interfaces
- Provider-agnostic implementation

## Installation

```bash
pnpm add @ttoss/react-auth-core
```

## Architecture

This package uses a screen-based architecture where authentication flows are managed through different screens (signIn, signUp, forgotPassword, etc.). Each screen can transition to other screens based on user actions.

## Basic Usage

### Auth Provider Setup

```tsx
import { AuthProvider, useAuth } from '@ttoss/react-auth-core';

function App() {
  const handleSignOut = async () => {
    // Your sign out implementation
    await myAuthService.signOut();
  };

  return (
    <AuthProvider signOut={handleSignOut}>
      <MyApp />
    </AuthProvider>
  );
}

function MyComponent() {
  const { isAuthenticated, user, tokens, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Complete Auth Flow

```tsx
import { Auth, useAuthScreen } from '@ttoss/react-auth-core';

function AuthPage() {
  const { screen, setScreen } = useAuthScreen({ value: 'signIn' });

  const handleSignIn = async (email: string, password: string) => {
    // Your sign in implementation
    const result = await myAuthService.signIn(email, password);
    if (result.success) {
      // Handle successful sign in
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    // Your sign up implementation
    const result = await myAuthService.signUp(email, password);
    if (result.requiresConfirmation) {
      setScreen({
        value: 'confirmSignUp',
        context: { email },
      });
    }
  };

  const handleForgotPassword = async (email: string) => {
    // Your forgot password implementation
    await myAuthService.forgotPassword(email);
    setScreen({
      value: 'confirmResetPassword',
      context: { email },
    });
  };

  return (
    <Auth
      screen={screen}
      setScreen={setScreen}
      onSignIn={handleSignIn}
      onSignUp={handleSignUp}
      onForgotPassword={handleForgotPassword}
      passwordMinimumLength={8}
    />
  );
}
```

### Available Screens

The authentication flow supports these screens:

- `signIn` - Main sign in form
- `signUp` - User registration form
- `forgotPassword` - Password recovery form
- `confirmSignUp` - Email confirmation after registration
- `confirmResetPassword` - Password reset confirmation

### Screen Transitions

Users can navigate between screens through built-in links:

- From sign in: go to sign up or forgot password
- From sign up: go to sign in
- From forgot password: go to sign in or sign up
- Programmatic transitions via `setScreen()`

### Layout Options

```tsx
// Full screen layout (default)
<Auth
  screen={screen}
  setScreen={setScreen}
  onSignIn={handleSignIn}
  layout={{ fullScreen: true }}
/>

// With side content
<Auth
  screen={screen}
  setScreen={setScreen}
  onSignIn={handleSignIn}
  layout={{
    fullScreen: true,
    sideContent: <MyBrandingContent />,
    sideContentPosition: 'left'
  }}
/>

// Inline layout
<Auth
  screen={screen}
  setScreen={setScreen}
  onSignIn={handleSignIn}
  layout={{ fullScreen: false }}
/>
```

### Custom Logo

```tsx
<Auth
  screen={screen}
  setScreen={setScreen}
  onSignIn={handleSignIn}
  logo={<MyLogo />}
/>
```

## TypeScript Support

All components and hooks are fully typed. Key types include:

- `AuthScreen` - Screen configuration with value and context
- `OnSignIn`, `OnSignUp` - Handler function signatures
- `AuthUser`, `AuthTokens` - User and token data structures
- `AuthContextValue` - Authentication context interface

## Error Handling

The package includes built-in error boundaries and proper error handling for authentication flows. Errors are managed at the component level and can be customized through the provider implementations.
