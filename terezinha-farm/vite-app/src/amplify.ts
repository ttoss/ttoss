import { Amplify, type ResourcesConfig } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { sessionStorage } from 'aws-amplify/utils';

const graphQLRegion =
  import.meta.env.VITE_APPSYNC_REGION ||
  import.meta.env.VITE_USER_POOL_ID.split('_')[0];

const config: ResourcesConfig = {
  API: {
    GraphQL: {
      defaultAuthMode: 'userPool',
      endpoint: import.meta.env.VITE_APPSYNC_GRAPHQL_ENDPOINT,
      region: graphQLRegion,
    },
  },
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_APP_CLIENT_ID,
    },
  },
};

Amplify.configure(config);

cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
