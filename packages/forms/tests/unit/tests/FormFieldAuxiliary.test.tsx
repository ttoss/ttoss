/* eslint-disable formatjs/no-literal-string-in-jsx */
import { render, screen } from '@ttoss/test-utils/react';
import { FormField } from 'src/FormField';
import { FormProvider, useForm } from 'src/index';

test('FormField renders auxiliary checkbox and message region', () => {
  const Render = () => {
    const formMethods = useForm<{ test: string; aux: boolean }>();

    return (
      <FormProvider {...formMethods}>
        <FormField<{ test: string; aux: boolean }, 'test'>
          name="test"
          label="Test"
          auxiliaryCheckbox={{ name: 'aux', label: 'Aux' }}
          render={({ field }) => {
            return <input {...field} aria-label="input-test" />;
          }}
        />
      </FormProvider>
    );
  };

  render(<Render />);

  expect(screen.getByLabelText('input-test')).toBeInTheDocument();
  expect(screen.getByText('Aux')).toBeInTheDocument();
});
