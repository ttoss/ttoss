import { appSyncClient } from '@ttoss/aws-appsync-nodejs';
import { config } from '@terezinha-farm/config';

const query = /* GraphQL */ `
  query farms {
    farms {
      edges {
        cursor
        node {
          id
          name
        }
      }
    }
  }
`;

/**
 * Using API Key
 */
appSyncClient.setConfig({
  endpoint: config.API_ENDPOINT as string,
  apiKey: config.API_KEY as string,
});

appSyncClient.query(query).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});

/**
 * Using IAM
 */
appSyncClient.setConfig({
  endpoint: config.API_ENDPOINT as string,
  region: config.REGION,
});

appSyncClient.query(query).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});
