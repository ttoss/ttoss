/**
 * FarmNotification subscription module.
 *
 * Demonstrates AppSync enhanced subscription filtering: the `farmId` argument
 * on `onFarmNotification` is used as a server-side filter. AppSync only
 * delivers the event to subscribers whose `farmId` variable matches the
 * `farmId` field in the mutation result.
 *
 * The `publishFarmNotification` mutation uses a NONE data source (no Lambda
 * invocation). AppSync passes the mutation arguments directly through to
 * subscribers. Backend services can trigger this mutation using IAM credentials
 * via `appSyncClient` from `@ttoss/aws-appsync-nodejs`.
 */
import './FarmNotificationTC';

import { EventEmitter, on } from 'node:events';

import { schemaComposer } from '@ttoss/graphql-api';

import type {
  MutationpublishFarmNotificationArgs,
  SubscriptiononFarmNotificationArgs,
} from '../../../schema/types';

const farmNotificationEventEmitter = new EventEmitter();
const farmNotificationEventName = 'farmNotification';

schemaComposer.addTypeDefs(/* GraphQL */ `
  extend type Mutation {
    publishFarmNotification(farmId: ID!, message: String!): FarmNotification!
  }

  extend type Subscription {
    onFarmNotification(farmId: ID!): FarmNotification
      @aws_subscribe(mutations: ["publishFarmNotification"])
  }
`);

schemaComposer.Mutation.extendField('publishFarmNotification', {
  resolve: (_source, args: MutationpublishFarmNotificationArgs) => {
    farmNotificationEventEmitter.emit(farmNotificationEventName, args);

    return args;
  },
});

schemaComposer.Subscription.extendField('onFarmNotification', {
  async *subscribe(_source, args: SubscriptiononFarmNotificationArgs) {
    for await (const [notification] of on(
      farmNotificationEventEmitter,
      farmNotificationEventName
    )) {
      const farmNotification =
        notification as MutationpublishFarmNotificationArgs;

      if (farmNotification.farmId === args.farmId) {
        yield {
          onFarmNotification: farmNotification,
        };
      }
    }
  },
  resolve: (payload: {
    onFarmNotification: MutationpublishFarmNotificationArgs;
  }) => {
    return payload.onFarmNotification;
  },
});
