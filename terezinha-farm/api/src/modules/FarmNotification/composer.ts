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

type FarmNotificationPayload = {
  farmId: string;
  message: string;
};

const farmNotificationEmitter = new EventEmitter();

const subscribeToFarmNotifications = async function* ({
  farmId,
}: {
  farmId: string;
}) {
  for await (const [payload] of on(
    farmNotificationEmitter,
    'farmNotification'
  )) {
    const notification = payload as FarmNotificationPayload;

    if (notification.farmId === farmId) {
      yield notification;
    }
  }
};

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
    const notification = {
      farmId: args.farmId,
      message: args.message,
    };

    farmNotificationEmitter.emit('farmNotification', notification);

    return notification;
  },
});

schemaComposer.Subscription.extendField('onFarmNotification', {
  subscribe: (_source, args: SubscriptiononFarmNotificationArgs) => {
    return subscribeToFarmNotifications({ farmId: args.farmId });
  },
  resolve: (payload: FarmNotificationPayload) => {
    return payload;
  },
});
