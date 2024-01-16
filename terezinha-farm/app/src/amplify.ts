import { Amplify, type ResourcesConfig } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { sessionStorage } from 'aws-amplify/utils';

const authConfig: ResourcesConfig['Auth'] = {
  Cognito: {
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_APP_CLIENT_ID,
  },
};

Amplify.configure({
  Auth: authConfig,
});

cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
