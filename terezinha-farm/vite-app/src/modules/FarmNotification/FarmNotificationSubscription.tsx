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
import { Box, Button, Flex, Heading, HelpText, Stack, Text } from '@ttoss/ui';
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

const FarmNotificationListener = ({ farmId }: { farmId: string }) => {
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
          setNotifications((prev) => {
            return [...prev, message];
          });
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
      <HelpText>
        Listening for notifications for farm <strong>{farmId}</strong>. AppSync
        will only deliver events whose <code>farmId</code> matches this value
        (enhanced filtering).
      </HelpText>
      {notifications.length === 0 ? (
        <Text sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          No notifications received yet…
        </Text>
      ) : (
        <ul>
          {notifications.map((msg, i) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i}>{msg}</li>
            );
          })}
        </ul>
      )}
    </Box>
  );
};

export const FarmNotificationPage = () => {
  const [inputValue, setInputValue] = React.useState('farm-1');
  const [activeFarmId, setActiveFarmId] = React.useState<string | null>(null);

  const handleSubscribe = () => {
    setActiveFarmId(inputValue.trim() || null);
  };

  const handleStop = () => {
    setActiveFarmId(null);
  };

  return (
    <Stack>
      <Heading variant="h2">Farm Notifications (Subscription)</Heading>
      <HelpText>
        Subscribe to real-time notifications for a specific farm. Enter a farm
        ID and click &ldquo;Subscribe&rdquo;. AppSync uses the{' '}
        <code>farmId</code> as a server-side enhanced filter — only events
        published for that farm are delivered to this client.
      </HelpText>

      <Flex sx={{ gap: 'sm', alignItems: 'center' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            return setInputValue(e.target.value);
          }}
          placeholder="Enter farm ID"
          style={{ padding: '8px', fontSize: '14px', flexGrow: 1 }}
        />
        {activeFarmId ? (
          <Button onClick={handleStop}>Stop</Button>
        ) : (
          <Button onClick={handleSubscribe} disabled={!inputValue.trim()}>
            Subscribe
          </Button>
        )}
      </Flex>

      {activeFarmId && (
        <React.Suspense fallback="Connecting…">
          <FarmNotificationListener farmId={activeFarmId} />
        </React.Suspense>
      )}
    </Stack>
  );
};

