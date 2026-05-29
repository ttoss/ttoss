/**
 * FarmNotification subscription example using Relay and AppSync enhanced
 * filtering.
 *
 * AppSync enhanced filtering: the `farmId` variable passed to the subscription
 * is used as a server-side filter. AppSync only delivers events where the
 * `farmId` field in the mutation result matches the subscriber's `farmId`
 * variable. This avoids broadcasting every notification to every connected
 * client.
 *
 * Prerequisites:
 * 1. Run `pnpm relay` (or `pnpm build`) after updating the schema so that the
 *    Relay compiler generates the `__generated__/FarmNotificationSubscription.graphql.ts`
 *    type file.
 * 2. Configure a WebSocket `subscribeFunction` in RelayEnvironment.ts that
 *    connects to the AppSync real-time endpoint.
 */
import * as React from 'react';
import { Box, Text } from '@ttoss/ui';
import { graphql, useSubscription } from 'react-relay';
import type { GraphQLSubscriptionConfig } from 'relay-runtime';

import type { FarmNotificationSubscription } from './__generated__/FarmNotificationSubscription.graphql';

const farmNotificationSubscription = graphql`
  subscription FarmNotificationSubscription($farmId: ID!) {
    onFarmNotification(farmId: $farmId) {
      farmId
      message
    }
  }
`;

export const FarmNotificationList = ({ farmId }: { farmId: string }) => {
  const [notifications, setNotifications] = React.useState<string[]>([]);

  const config = React.useMemo<
    GraphQLSubscriptionConfig<FarmNotificationSubscription>
  >(
    () => ({
      subscription: farmNotificationSubscription,
      /**
       * `farmId` is passed as a variable to the subscription. AppSync uses
       * this value as an enhanced filter: only events where the mutation
       * result's `farmId` matches this value are delivered to this subscriber.
       */
      variables: { farmId },
      onNext: (data) => {
        const message = data?.onFarmNotification?.message;
        if (message) {
          setNotifications((prev) => [...prev, message]);
        }
      },
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error('FarmNotification subscription error:', error);
      },
    }),
    [farmId]
  );

  useSubscription(config);

  return (
    <Box>
      {notifications.length === 0 ? (
        <Text>Waiting for notifications for farm {farmId}…</Text>
      ) : (
        <ul>
          {notifications.map((msg, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}
    </Box>
  );
};
