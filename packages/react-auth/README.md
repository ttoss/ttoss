# @ttoss/react-auth

## About

This module handles auth in your applications and other ttoss modules.

This module is intended to use with AWS Cognito. It uses [AWS Amplify](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js) under the hood.

[Amplify Auth configuration](https://docs.amplify.aws/lib/auth/start/q/platform/js#re-use-existing-authentication-resource) must be provided in your App to make Auth Module works properly.

### ESM Only

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Getting Started

### Install

```shell
$ yarn add @ttoss/auth @ttoss/react-notifications aws-amplify
```

## Examples of use

### Amplify config

```ts
import { Amplify, type ResourcesConfig } from 'aws-amplify';
import {
  CookieStorage,
  KeyValueStorageInterface,
  defaultStorage,
  sessionStorage,
} from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

const authConfig: ResourcesConfig['Auth'] = {
  Cognito: {
    // REQUIRED Amazon Cognito User Pool Client ID (26-char alphanumeric string)
    userPoolClientId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3',

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: 'XX-XXXX-X_abcd1234',

    loginWith: {
      // OPTIONAL - Hosted UI configuration
      oauth: {
        domain: 'your_cognito_domain',
        scopes: [
          'phone',
          'email',
          'profile',
          'openid',
          'aws.cognito.signin.user.admin',
        ],
        redirectSignIn: ['http://localhost:3000/'],
        redirectSignOut: ['http://localhost:3000/'],
        responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
      },
    },
  },
};

Amplify.configure({
  Auth: authConfig,
});

// Browser Local Storage
// In Amplify the localStorage is the default storage mechanism. It saves the tokens in the browser's localStorage.
// This local storage will persist across browser sessions and tabs. You can explicitly set to this storage by calling:
cognitoUserPoolsTokenProvider.setKeyValueStorage(defaultStorage);

// Cookie Storage
// CookieStorage saves the tokens in the browser's Cookies. The cookies will persist across browser sessions and tabs.
// You can explicitly set to this storage by calling:
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage(
    // OPTIONAL - Configuration for cookie storage
    {
      // REQUIRED - Cookie domain (only required if cookieStorage is provided)
      domain: '.yourdomain.com',
      // OPTIONAL - Cookie path
      path: '/',
      // OPTIONAL - Cookie expiration in days
      expires: 365,
      // OPTIONAL - See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
      sameSite: 'strict' | 'lax' | 'none',
      // OPTIONAL - Cookie secure flag
      // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
      secure: true,
    }
  )
);

// Browser Session Storage
// sessionStorage saves the tokens in the browser's sessionStorage and these tokens will clear when a tab is closed.
// The benefit to this storage mechanism is that the session only lasts as long as the browser is open and you
// can sign out users when they close the tab. You can update to this storage by calling:
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);

// Custom Storage
// You can implement your own custom storage mechanism by creating a class that implements the storage interface.
// Here is an example that uses memory storage:

class MyCustomStorage implements KeyValueStorageInterface {
  storageObject: Record<string, string> = {};
  async setItem(key: string, value: string): Promise<void> {
    this.storageObject[key] = value;
  }
  async getItem(key: string): Promise<string | null> {
    return this.storageObject[key];
  }
  async removeItem(key: string): Promise<void> {
    delete this.storageObject[key];
  }
  async clear(): Promise<void> {
    this.storageObject = {};
  }
}

cognitoUserPoolsTokenProvider.setKeyValueStorage(new MyCustomStorage());
```

### PrivateRoute component

```tsx
import { useAuth } from '@ttoss/react-auth';

const PrivateRoute = (props: any) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ redirectTo: props.path || '/' }} />;
  }
  return <Route {...props} />;
};
```

### Login Page

```tsx
import { Auth, useAuth } from '@ttoss/react-auth';

const Login = () => {
  const auth = useAuth();

  const onSuccess = () => {
    // Navigate to logged-area
  };

  return (
    <div>
      <h1>Login Page</h1>

      <Auth onSignIn={onSuccess} />

      <button onClick={auth.signOut}>Logout</button>
    </div>
  );
};
export default Login;
```

## Auth with Progressbar

```tsx
import { AuthProvider } from '@ttoss/react-auth';
import { NotificationsProvider } from '@ttoss/react-notifications';

ReactDOM.render(
  <React.StrictMode>
    <NotificationsProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </NotificationsProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```
