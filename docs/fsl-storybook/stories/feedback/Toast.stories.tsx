import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  createToastQueue,
  Stack,
  Toast,
  ToastRegion,
} from '@ttoss/fsl-ui';

const queue = createToastQueue({ maxVisibleToasts: 5 });

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  subcomponents: { ToastRegion },
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    return (
      <>
        <Stack direction="horizontal" gap="md">
          <Button
            evaluation="secondary"
            onPress={() => {
              queue.add({ title: 'Invitation sent' }, { timeout: 4000 });
            }}
          >
            Show toast
          </Button>
          <Button
            evaluation="secondary"
            onPress={() => {
              queue.add(
                {
                  title: 'Deploy failed',
                  description: 'Check the build log for details.',
                  evaluation: 'negative',
                },
                { timeout: 6000 }
              );
            }}
          >
            Show negative toast
          </Button>
        </Stack>
        <ToastRegion queue={queue} />
      </>
    );
  },
};
