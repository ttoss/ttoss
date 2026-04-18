import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  createToastQueue,
  type ToastContent,
  ToastRegion,
} from '@ttoss/ui2';

// One queue per story session — stories hot-reload, but the queue is
// deliberately module-scoped so every button click adds to the same region.
const queue = createToastQueue({ maxVisibleToasts: 5 });

const pushToast = (content: ToastContent, timeout = 5000) => {
  queue.add(content, { timeout });
};

const meta: Meta = {
  title: 'ui2/Toast',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A Feedback toast surface. Use `createToastQueue()` to build a queue, mount `<ToastRegion queue={queue} />` once near the root, and call `queue.add({ title, description, evaluation })` from anywhere to surface a notification.',
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <div style={{ padding: 24, minHeight: '80vh', position: 'relative' }}>
          <Story />
          <ToastRegion queue={queue} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj;

/** Default — tap to enqueue a primary toast. */
export const Default: Story = {
  render: () => {
    return (
      <Button
        onPress={() => {
          return pushToast({
            title: 'Saved',
            description: 'Your changes are live.',
          });
        }}
      >
        Enqueue primary toast
      </Button>
    );
  },
};

/** AllEvaluations — the 4 legal Feedback evaluations in one region. */
export const AllEvaluations: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button
          evaluation="primary"
          onPress={() => {
            return pushToast({
              title: 'Heads up',
              description: 'A neutral notification.',
              evaluation: 'primary',
            });
          }}
        >
          primary
        </Button>
        <Button
          evaluation="primary"
          onPress={() => {
            return pushToast({
              title: 'Success',
              description: 'Everything went through.',
              evaluation: 'positive',
            });
          }}
        >
          positive
        </Button>
        <Button
          evaluation="primary"
          onPress={() => {
            return pushToast({
              title: 'Almost full',
              description: 'You are at 90% of your quota.',
              evaluation: 'caution',
            });
          }}
        >
          caution
        </Button>
        <Button
          evaluation="negative"
          onPress={() => {
            return pushToast({
              title: 'Failed',
              description: 'The request could not complete.',
              evaluation: 'negative',
            });
          }}
        >
          negative
        </Button>
      </div>
    );
  },
};

/** Persistent — no timeout; the user must dismiss. */
export const Persistent: Story = {
  render: () => {
    return (
      <Button
        onPress={() => {
          return queue.add(
            {
              title: 'Action required',
              description: 'This toast will not close on its own.',
              evaluation: 'caution',
            },
            {}
          );
        }}
      >
        Enqueue persistent toast
      </Button>
    );
  },
};
