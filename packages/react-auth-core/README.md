# @ttoss/react-auth-core

Core authentication components and abstractions for React applications. This package provides UI components and base abstractions that can be used with any authentication provider.

## Features

- Generic authentication UI components
- Base authentication provider interface
- Type definitions for authentication flows
- Reusable hooks and contexts
- Provider-agnostic implementation

## Installation

```bash
pnpm add @ttoss/react-auth-core
```

## Usage

This package provides the building blocks for authentication UIs. It's designed to be used with specific authentication provider implementations.

### Basic Auth Provider

```tsx
import { AuthProvider, useAuth } from '@ttoss/react-auth-core';

// Implement your authentication provider
const myAuthProvider = {
  signIn: async (email, password) => {
    /* implementation */
  },
  signUp: async (email, password) => {
    /* implementation */
  },
  signOut: async () => {
    /* implementation */
  },
  // ... other methods
};

function App() {
  return (
    <AuthProvider provider={myAuthProvider}>
      <MyApp />
    </AuthProvider>
  );
}
```

### Using Components

```tsx
import { AuthSignIn, AuthSignUp } from '@ttoss/react-auth-core';

function LoginPage() {
  const { signIn } = useAuth();

  return (
    <AuthSignIn
      onSignIn={signIn}
      onSignUp={() => navigate('/signup')}
      onForgotPassword={() => navigate('/forgot')}
    />
  );
}
```

## Architecture

This package follows the adapter pattern, allowing different authentication providers to be plugged in while maintaining consistent UI components and user experience.
