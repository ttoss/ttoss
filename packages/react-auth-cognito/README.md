# @ttoss/react-auth-cognito

AWS Cognito authentication module for React applications using AWS Amplify, built on top of `@ttoss/react-auth-core` for provider-agnostic authentication patterns.

## Installation

```shell
pnpm add @ttoss/react-auth-cognito @ttoss/react-notifications aws-amplify
```

## Core Concepts

This package provides AWS Cognito-specific implementations of the authentication patterns defined in `@ttoss/react-auth-core`. It automatically handles Amplify configuration, auth state management, and integrates with ttoss notification system.

**Key Features:**

- AWS Cognito authentication with Amplify
- Automatic auth state synchronization
- Built-in error handling and notifications
- TypeScript support with full type safety
- ESM-only package

## Quick Start

### 1. Configure AWS Amplify

```ts
import { Amplify, type ResourcesConfig } from 'aws-amplify';

/**
 * https://docs.amplify.aws/gen1/react/build-a-backend/auth/set-up-auth/
 */
const authConfig: ResourcesConfig['Auth'] = {
  Cognito: {
    // ... your Cognito config
  },
};

Amplify.configure({ Auth: authConfig });
```

### 2. Setup Authentication Provider

```tsx
import { AuthProvider } from '@ttoss/react-auth-cognito';
import { NotificationsProvider } from '@ttoss/react-notifications';

function App() {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <YourApp />
      </AuthProvider>
    </NotificationsProvider>
  );
}
```

### 3. Use Authentication in Components

```tsx
import { Auth, useAuth } from '@ttoss/react-auth-cognito';
import { Navigate } from 'react-router-dom';

// Authentication form component
function LoginPage() {
  return <Auth />;
}

// Authentication form with error handling
function LoginPageWithErrorHandling() {
  const handleAuthError = (error: Error) => {
    console.error('Authentication error:', error);
    // Custom error handling logic
  };

  return <Auth onError={handleAuthError} />;
}

// Protected route component
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Using auth state
function UserProfile() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## API Reference

### `<Auth />`

The main authentication component that renders sign-in, sign-up, and password recovery flows.

**Props:**

- `signUpTerms?: React.ReactNode` - Optional terms and conditions to display during sign-up
- `logo?: React.ReactNode` - Optional logo to display in the authentication form
- `layout?: 'default' | 'centered'` - Layout style for the authentication form
- `onError?: (error: Error) => void` - Callback function invoked when authentication errors occur. Receives the error object from failed authentication operations (sign-in, sign-up, password reset, etc.)

**Example:**

```tsx
<Auth
  logo={<img src="/logo.png" alt="Logo" />}
  signUpTerms={<p>By signing up, you agree to our Terms of Service</p>}
  onError={(error) => {
    console.error('Auth error:', error);
    // Send to error tracking service
  }}
/>
```

### `useAuth()`

Returns authentication state and methods:

```tsx
const {
  user, // Current user data or null
  isAuthenticated, // Boolean authentication status
  signOut, // Function to sign out user
} = useAuth();
```

### `getAuthData(options?)`

Retrieve current authentication data programmatically:

```tsx
import { getAuthData } from '@ttoss/react-auth-cognito';

const authData = await getAuthData({ includeTokens: true });
```

### `checkAuth()`

Check if user is currently authenticated:

```tsx
import { checkAuth } from '@ttoss/react-auth-cognito';

const isAuthenticated = await checkAuth();
```

## Storage Configuration

Configure token storage mechanism using Amplify's storage options:

```ts
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage, sessionStorage } from 'aws-amplify/utils';

// Cookie storage (recommended for production)
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: '.yourdomain.com',
    secure: true,
    sameSite: 'strict',
  })
);

// Session storage (clears on tab close)
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
```
