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
$ yarn add @ttoss/auth @ttoss/react-notifications
```

## Examples of use

### Amplify config

```ts
import Amplify from 'aws-amplify';

Amplify.configure({
  Auth: {
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    identityPoolId: 'XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab',

    // REQUIRED - Amazon Cognito Region
    region: 'XX-XXXX-X',

    // OPTIONAL - Amazon Cognito Federated Identity Pool Region
    // Required only if it's different from Amazon Cognito Region
    identityPoolRegion: 'XX-XXXX-X',

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: 'XX-XXXX-X_abcd1234',

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3',

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    mandatorySignIn: false,

    // OPTIONAL - Configuration for cookie storage
    // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
    cookieStorage: {
      // REQUIRED - Cookie domain (only required if cookieStorage is provided)
      domain: '.yourdomain.com',
      // OPTIONAL - Cookie path
      path: '/',
      // OPTIONAL - Cookie expiration in days
      expires: 365,
      // OPTIONAL - See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
      sameSite: 'strict' | 'lax',
      // OPTIONAL - Cookie secure flag
      // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
      secure: true,
    },

    // OPTIONAL - customized storage object
    storage: MyStorage,

    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    authenticationFlowType: 'USER_PASSWORD_AUTH',

    // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
    clientMetadata: { myCustomKey: 'myCustomValue' },

    // OPTIONAL - Hosted UI configuration
    oauth: {
      domain: 'your_cognito_domain',
      scope: [
        'phone',
        'email',
        'profile',
        'openid',
        'aws.cognito.signin.user.admin',
      ],
      redirectSignIn: 'http://localhost:3000/',
      redirectSignOut: 'http://localhost:3000/',
      responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
    },
  },
});
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
