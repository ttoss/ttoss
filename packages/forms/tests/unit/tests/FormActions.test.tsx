import { render, screen } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { Form, FormActions, useForm } from 'src/index';

test('should be defined', () => {
  expect(FormActions).toBeDefined();
});

test('Form.Actions is the same as FormActions', () => {
  expect(Form.Actions).toBe(FormActions);
});

test('Form.Group is the same as FormGroup exported from index', async () => {
  const { FormGroup } = await import('src/index');
  expect(Form.Group).toBe(FormGroup);
});

test('renders children inside FormActions', () => {
  render(
    <FormActions>
      <Button>Cancel</Button>
      <Button type="submit">Save</Button>
    </FormActions>
  );

  expect(screen.getByText('Cancel')).toBeInTheDocument();
  expect(screen.getByText('Save')).toBeInTheDocument();
});

test.each([
  ['left', 'flex-start'],
  ['center', 'center'],
  ['right', 'flex-end'],
] as const)('align="%s" sets justifyContent to "%s"', (align, expected) => {
  const { container } = render(
    <FormActions align={align}>
      <Button>Save</Button>
    </FormActions>
  );

  const flex = container.firstChild as HTMLElement;
  expect(flex).toHaveStyle({ justifyContent: expected });
});

test('defaults to right alignment', () => {
  const { container } = render(
    <FormActions>
      <Button>Save</Button>
    </FormActions>
  );

  const flex = container.firstChild as HTMLElement;
  expect(flex).toHaveStyle({ justifyContent: 'flex-end' });
});

test('sticky=true applies position sticky and bottom 0', () => {
  const { container } = render(
    <FormActions sticky>
      <Button>Save</Button>
    </FormActions>
  );

  const flex = container.firstChild as HTMLElement;
  expect(flex).toHaveStyle({ position: 'sticky', bottom: '0px' });
});

test('sticky defaults to false (no sticky positioning)', () => {
  const { container } = render(
    <FormActions>
      <Button>Save</Button>
    </FormActions>
  );

  const flex = container.firstChild as HTMLElement;
  expect(flex).not.toHaveStyle({ position: 'sticky' });
});

test('renders FormActions inside a Form', () => {
  const RenderForm = () => {
    const formMethods = useForm();
    return (
      <Form
        {...formMethods}
        onSubmit={() => {
          return undefined;
        }}
      >
        <Form.Actions>
          <Button>Cancel</Button>
          <Button type="submit">Save</Button>
        </Form.Actions>
      </Form>
    );
  };

  render(<RenderForm />);

  expect(screen.getByText('Cancel')).toBeInTheDocument();
  expect(screen.getByText('Save')).toBeInTheDocument();
});
