import { Config, appSyncClient } from '@ttoss/aws-appsync-nodejs';
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
appSyncClient.setConfig(config as Config);

appSyncClient.query(query, { id: '1' }).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});

/**
 * Using IAM
 */
appSyncClient.setConfig({
  apiEndpoint: config.apiEndpoint as string,
});

appSyncClient.query(query, { id: '1' }).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});
