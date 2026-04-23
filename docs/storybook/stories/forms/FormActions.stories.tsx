import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Form, FormActions, FormFieldInput, useForm } from '@ttoss/forms';
import { Button } from '@ttoss/ui';
import { action } from 'storybook/actions';

export default {
  title: 'Forms/FormActions',
  component: FormActions,
  tags: ['autodocs'],
} as Meta<typeof FormActions>;

type Story = StoryObj<typeof FormActions>;

/**
 * Default usage: a single submit button aligned to the right.
 */
export const Default: Story = {
  render: () => {
    const Wrapper = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={action('onSubmit')}>
          <FormFieldInput name="name" label="Name" placeholder="Your name" />
          <Form.Actions>
            <Button type="submit">Save</Button>
          </Form.Actions>
        </Form>
      );
    };
    return <Wrapper />;
  },
};

/**
 * Multiple actions: Cancel and Save buttons.
 */
export const WithCancelAndSave: Story = {
  render: () => {
    const Wrapper = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={action('onSubmit')}>
          <FormFieldInput name="name" label="Name" placeholder="Your name" />
          <Form.Actions>
            <Button variant="secondary" onClick={action('onCancel')}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Form.Actions>
        </Form>
      );
    };
    return <Wrapper />;
  },
};

/**
 * Three actions: Delete, Cancel, and Save.
 */
export const WithDeleteCancelSave: Story = {
  render: () => {
    const Wrapper = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={action('onSubmit')}>
          <FormFieldInput name="name" label="Name" placeholder="Your name" />
          <Form.Actions sx={{ justifyContent: 'space-between' }}>
            <Button variant="danger" onClick={action('onDelete')}>
              Delete
            </Button>
            <Form.Actions sx={{ marginTop: 0 }}>
              <Button variant="secondary" onClick={action('onCancel')}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </Form.Actions>
          </Form.Actions>
        </Form>
      );
    };
    return <Wrapper />;
  },
};

/**
 * Controls horizontal alignment of the action buttons via the `align` prop.
 * Supported values are `'left'`, `'center'`, and `'right'` (default).
 */
export const Alignment: Story = {
  render: () => {
    const Wrapper = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={action('onSubmit')}>
          <FormFieldInput name="name" label="Name" placeholder="Your name" />
          <Form.Actions align="left">
            <Button variant="secondary" onClick={action('onCancel')}>
              Cancel (left)
            </Button>
            <Button type="submit">Save (left)</Button>
          </Form.Actions>
          <Form.Actions align="center">
            <Button variant="secondary" onClick={action('onCancel')}>
              Cancel (center)
            </Button>
            <Button type="submit">Save (center)</Button>
          </Form.Actions>
          <Form.Actions align="right">
            <Button variant="secondary" onClick={action('onCancel')}>
              Cancel (right)
            </Button>
            <Button type="submit">Save (right)</Button>
          </Form.Actions>
        </Form>
      );
    };
    return <Wrapper />;
  },
};

/**
 * When `sticky` is set, the action bar stays fixed at the bottom of the
 * viewport while the user scrolls through a long form.
 */
export const Sticky: Story = {
  render: () => {
    const Wrapper = () => {
      const formMethods = useForm();
      return (
        <Form {...formMethods} onSubmit={action('onSubmit')}>
          {Array.from({ length: 12 }, (_, i) => {
            return (
              <FormFieldInput
                key={i}
                name={`field${i}`}
                label={`Field ${i + 1}`}
                placeholder={`Value ${i + 1}`}
              />
            );
          })}
          <Form.Actions sticky>
            <Button variant="secondary" onClick={action('onCancel')}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Form.Actions>
        </Form>
      );
    };
    return <Wrapper />;
  },
};
