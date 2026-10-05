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
- `socialProviders?: ('Google' | 'Facebook')[]` - Federated identity providers to offer alongside email/password (see [Social sign-in](#social-sign-in))
- `initialScreen?: AuthScreen` - The screen shown first, e.g. `{ value: 'signUp' }` for a sign-up link. Read on mount only. Defaults to `signIn`.
- `autoSignInAfterSignUp?: boolean` - Sign the user in right after they confirm the sign-up code, instead of sending them back to the sign-in screen (see [Auto sign-in after sign-up](#auto-sign-in-after-sign-up)). Defaults to `false`.
- `onAuthEvent?: (event: AuthEvent) => void` - Called on every screen shown and on the outcome of every action, including the user mistakes `onError` skips (see [Tracking the auth flow](#tracking-the-auth-flow))

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

### Opening on a given screen

`useAuthScreen` from `@ttoss/react-auth-core` is local state, not a context: calling it outside `<Auth />` creates a separate screen that `<Auth />` never reads. To open on sign-up (for example from a `?authScreen=signUp` link), pass `initialScreen`:

```tsx
<Auth initialScreen={{ value: 'signUp' }} />
```

### Auto sign-in after sign-up

By default, confirming the sign-up code returns the user to the sign-in screen to type the password again. With `autoSignInAfterSignUp`, `signUp` runs with Amplify's `autoSignIn` option and the confirmed user is signed in directly:

```tsx
<Auth autoSignInAfterSignUp />
```

Amplify only offers this within the browser session that ran `signUp`. A user who confirms later (after a reload, or by signing in with an unconfirmed account) still lands on the sign-in screen, as does one whose auto sign-in fails (that error also reaches `onError`).

### Tracking the auth flow

`onAuthEvent` reports where users get stuck. It receives an `AuthEvent`:

- `{ type: 'screenViewed', screen }` - on mount and on every screen change
- `{ type: 'actionSucceeded', action, nextStep? }` - `nextStep` is Amplify's, e.g. `CONFIRM_SIGN_UP`
- `{ type: 'actionFailed', action, errorName }` - the Cognito error name, e.g. `NotAuthorizedException`

`action` is one of `signIn`, `signUp`, `confirmSignUp`, `autoSignIn`, `forgotPassword`, `confirmResetPassword` or `socialSignIn`. Events never hold the email, password or code the user typed, so they can go straight to analytics:

```tsx
<Auth
  onAuthEvent={(event) => {
    posthog.capture(`auth_${event.type}`, event);
  }}
/>
```

### Social sign-in

Pass `socialProviders` to render a "Continue with …" button per provider on the sign-in and sign-up screens. Clicking one calls Amplify's `signInWithRedirect`, which sends the user to the Cognito hosted UI.

```tsx
<Auth socialProviders={['Google', 'Facebook']} />
```

Three things must line up, or the button redirects to an error page:

1. The provider is configured on the user pool and listed in the app client's `SupportedIdentityProviders` — `@ttoss/cloud-auth`'s `identityProviders` option does both.
2. The user pool has a hosted UI domain, and the app client allows the redirect URLs.
3. The Amplify config declares `Auth.Cognito.loginWith.oauth`:

```ts
const authConfig: ResourcesConfig['Auth'] = {
  Cognito: {
    userPoolId: '...',
    userPoolClientId: '...',
    loginWith: {
      oauth: {
        domain: 'my-app.auth.us-east-1.amazoncognito.com',
        scopes: ['openid', 'email', 'profile'],
        redirectSignIn: ['https://app.example.com/'],
        redirectSignOut: ['https://app.example.com/auth'],
        responseType: 'code',
      },
    },
  },
};
```

Cognito creates a **separate** user for a federated sign-in, with a new `sub`, even when the email matches an existing username/password user. Linking the two is a user-pool concern (a `preSignUp` Lambda calling `AdminLinkProviderForUser`), not something this component can do.

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
