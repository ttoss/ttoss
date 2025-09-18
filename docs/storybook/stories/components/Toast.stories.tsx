import { Meta, StoryFn } from '@storybook/react-webpack5';
import { toast, ToastContainer } from '@ttoss/components/Toast';
import { Button } from '@ttoss/ui';

export default {
  title: 'Components/Toast',
} as Meta;

const Template: StoryFn = () => {
  const notify = () => {
    toast('Default Notification!');
    toast.success('Success Notification!');
    toast.error('Error Notification!');
    toast.warn('Warning Notification!');
    toast.info('Info Notification!');
  };

  return (
    <>
      <ToastContainer />
      <Button onClick={notify}>Notify</Button>
    </>
  );
};

export const Example = Template.bind({});
