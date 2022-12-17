import { Config, appSyncClient } from '@ttoss/aws-appsync-nodejs';
import { config } from '@terezinha-farm/config';

appSyncClient.setConfig(config as Config);

const query = /* GraphQL */ `
  query user($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

appSyncClient.query(query, { id: '1' }).then((result) => {
  // eslint-disable-next-line no-console
  console.log(result);
});
