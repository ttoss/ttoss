/* eslint-disable turbo/no-undeclared-env-vars */
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    identityPoolId: process.env.VITE_IDENTITY_POOL_ID,
    region: process.env.VITE_REGION,
    userPoolId: process.env.VITE_USER_POOL_ID,
    userPoolWebClientId: process.env.VITE_APP_CLIENT_ID,
  },
});
