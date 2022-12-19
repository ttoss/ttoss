import { appSyncClient } from '@ttoss/aws-appsync-nodejs';
import { config } from '@terezinha-farm/config';

const query = /* GraphQL */ `
  query user($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

/**
 * Using API Key
 */
appSyncClient.setConfig({
  apiEndpoint: config.API_ENDPOINT as string,
  apiKey: config.API_KEY as string,
});

appSyncClient.query(query, { id: '1' }).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});

/**
 * Using IAM
 */
appSyncClient.setConfig({
  apiEndpoint: config.API_ENDPOINT as string,
});

appSyncClient.query(query, { id: '1' }).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});
