import { Box, Button, Flex, Heading, HelpText, Stack, Text } from '@ttoss/ui';
import { generateClient } from 'aws-amplify/api';
import * as React from 'react';

type FarmNotificationEvent = {
  onFarmNotification?: {
    farmId: string;
    message: string;
  } | null;
};

type PublishFarmNotificationResult = {
  publishFarmNotification?: {
    farmId: string;
    message: string;
  } | null;
};

type GraphQLObserver<TData> = {
  error?: (error: unknown) => void;
  next?: (value: { data?: TData }) => void;
};

type GraphQLSubscription<TData> = {
  subscribe: (observer: GraphQLObserver<TData>) => { unsubscribe: () => void };
};

const client = generateClient();

const farmNotificationSubscription = /* GraphQL */ `
  subscription FarmNotificationSubscription($farmId: ID!) {
    onFarmNotification(farmId: $farmId) {
      farmId
      message
    }
  }
`;

const publishFarmNotificationMutation = /* GraphQL */ `
  mutation PublishFarmNotification($farmId: ID!, $message: String!) {
    publishFarmNotification(farmId: $farmId, message: $message) {
      farmId
      message
    }
  }
`;

const uiText = {
  emptyNotifications: 'No notifications received yet…',
  farmIdCode: 'farmId',
  heading: 'Farm Notifications (Subscription)',
  listenerPrefix: 'Listening for notifications for farm ',
  listenerSuffix: '. AppSync only delivers events whose ',
  listenerSuffixAfterCode: ' matches this value.',
  messagePlaceholder: 'Enter notification message',
  notificationNotPublished: 'Notification was not published.',
  publishMutationCode: 'publishFarmNotification',
  publishButton: 'Send test notification',
  publishMutateCode: 'appSyncClient.mutate()',
  publishHelpPrefix: 'Trigger uses the same ',
  publishHelpSuffix: ' mutation that a backend Lambda would call with ',
  publishHelpSuffixAfterCode: '.',
  publishingButton: 'Publishing…',
  stopButton: 'Stop',
  subscribeButton: 'Subscribe',
  subscribeHelpPrefix:
    'Subscribe to real-time notifications for a specific farm, then use the mutation below to publish a test notification to the same ',
  subscribeHelpSuffix: '. AppSync uses that value as a server-side filter.',
  subscribePlaceholder: 'Enter farm ID',
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error.';
};

const FarmNotificationListener = ({ farmId }: { farmId: string }) => {
  const [notifications, setNotifications] = React.useState<string[]>([]);
  const [subscriptionError, setSubscriptionError] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    const subscription = client.graphql({
      query: farmNotificationSubscription,
      variables: { farmId },
    }) as GraphQLSubscription<FarmNotificationEvent>;

    const connection = subscription.subscribe({
      next: ({ data }) => {
        const message = data?.onFarmNotification?.message;

        if (message) {
          setNotifications((prev) => {
            return [...prev, message];
          });
        }
      },
      error: (error) => {
        setSubscriptionError(getErrorMessage(error));

        // eslint-disable-next-line no-console
        console.error('FarmNotification subscription error:', error);
      },
    });

    return () => {
      connection.unsubscribe();
    };
  }, [farmId]);

  return (
    <Box>
      <HelpText>
        {uiText.listenerPrefix}
        <strong>{farmId}</strong>
        {uiText.listenerSuffix}
        <code>{uiText.farmIdCode}</code>
        {uiText.listenerSuffixAfterCode}
      </HelpText>
      {subscriptionError ? (
        <Text sx={{ color: 'danger' }}>{subscriptionError}</Text>
      ) : null}
      {notifications.length === 0 ? (
        <Text sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          {uiText.emptyNotifications}
        </Text>
      ) : (
        <ul>
          {notifications.map((msg, i) => {
            return <li key={i}>{msg}</li>;
          })}
        </ul>
      )}
    </Box>
  );
};

/**
 * Demonstrates AppSync subscription filtering and lets the app trigger the
 * matching mutation so the active subscriber can receive events immediately.
 */
export const FarmNotificationPage = () => {
  const [inputValue, setInputValue] = React.useState('farm-1');
  const [messageValue, setMessageValue] = React.useState(
    'Sensor alert from app'
  );
  const [activeFarmId, setActiveFarmId] = React.useState<string | null>(null);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = React.useState<string | null>(
    null
  );
  const [isPublishing, setIsPublishing] = React.useState(false);

  const handleSubscribe = () => {
    setActiveFarmId(inputValue.trim() || null);
  };

  const handleStop = () => {
    setActiveFarmId(null);
  };

  const handlePublish = async () => {
    if (!activeFarmId || !messageValue.trim()) {
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      const result = (await client.graphql({
        query: publishFarmNotificationMutation,
        variables: {
          farmId: activeFarmId,
          message: messageValue.trim(),
        },
      })) as { data?: PublishFarmNotificationResult };

      const notification = result.data?.publishFarmNotification;

      if (!notification) {
        throw new Error(uiText.notificationNotPublished);
      }

      setPublishSuccess(
        `Published notification for ${notification.farmId}: ${notification.message}`
      );
    } catch (error) {
      setPublishError(getErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Stack>
      <Heading variant="h2">{uiText.heading}</Heading>
      <HelpText>
        {uiText.subscribeHelpPrefix}
        <code>{uiText.farmIdCode}</code>
        {uiText.subscribeHelpSuffix}
      </HelpText>

      <Flex sx={{ gap: 'sm', alignItems: 'center' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(event) => {
            return setInputValue(event.target.value);
          }}
          placeholder={uiText.subscribePlaceholder}
          style={{ padding: '8px', fontSize: '14px', flexGrow: 1 }}
        />
        {activeFarmId ? (
          <Button onClick={handleStop}>{uiText.stopButton}</Button>
        ) : (
          <Button onClick={handleSubscribe} disabled={!inputValue.trim()}>
            {uiText.subscribeButton}
          </Button>
        )}
      </Flex>

      <Flex sx={{ gap: 'sm', alignItems: 'center' }}>
        <input
          type="text"
          value={messageValue}
          onChange={(event) => {
            return setMessageValue(event.target.value);
          }}
          placeholder={uiText.messagePlaceholder}
          style={{ padding: '8px', fontSize: '14px', flexGrow: 1 }}
        />
        <Button
          onClick={handlePublish}
          disabled={!activeFarmId || !messageValue.trim() || isPublishing}
        >
          {isPublishing ? uiText.publishingButton : uiText.publishButton}
        </Button>
      </Flex>

      <HelpText>
        {uiText.publishHelpPrefix}
        <code>{uiText.publishMutationCode}</code>
        {uiText.publishHelpSuffix}
        <code>{uiText.publishMutateCode}</code>
        {uiText.publishHelpSuffixAfterCode}
      </HelpText>

      {publishError ? (
        <Text sx={{ color: 'danger' }}>{publishError}</Text>
      ) : null}
      {publishSuccess ? (
        <Text sx={{ color: 'success' }}>{publishSuccess}</Text>
      ) : null}

      {activeFarmId ? (
        <FarmNotificationListener key={activeFarmId} farmId={activeFarmId} />
      ) : null}
    </Stack>
  );
};
