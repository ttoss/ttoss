import { Button } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import { ToastContainer, toast } from '@ttoss/components';

export default {
  title: 'Components/Toast',
} as Meta;

const Template: Story = () => {
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
