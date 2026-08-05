/**
 * react-hook-form + Zod ↔ fsl-ui bridge (ADR-027, superseding ADR-004).
 *
 * This suite is the living recipe: fsl-ui controls connect through the plain
 * `Controller`, mapping `field.*` / `fieldState.invalid` onto the controls'
 * controlled props. No adapter entry point ships.
 *
 * **The imports are the recipe.** It used to pull the same four symbols from
 * `@ttoss/forms`, whose single entry also exports the legacy `FormField*`
 * suite with `@ttoss/ui`, `@ttoss/components` and `@ttoss/react-i18n` as peers
 * — so following the documented recipe dragged all of that into an fsl-first
 * app (F-005). fsl-ui takes no form-library dependency ever, so the recipe
 * names the upstream packages directly and this file proves the one it names.
 *
 * Nothing here is required to use fsl-ui: React Aria's native validation is
 * the default and the Studio uses only that. This is the bridge for an app
 * that already runs react-hook-form.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Controller, useForm } from 'react-hook-form';
import {
  Checkbox,
  Form,
  FormActions,
  FormSubmit,
  Select,
  SelectItem,
  TextField,
  TextFieldControl,
  TextFieldError,
  TextFieldLabel,
} from 'src/index';
import { z } from 'zod';

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  framework: z.string().min(1, 'Pick a framework'),
  terms: z.boolean().refine(
    (accepted) => {
      return accepted;
    },
    { message: 'You must accept the terms' }
  ),
});

type FormValues = z.infer<typeof schema>;

const BridgeForm = ({ onValid }: { onValid: (values: FormValues) => void }) => {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', framework: '', terms: false },
  });

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onValid)(event);
      }}
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => {
          return (
            <TextField
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              isInvalid={fieldState.invalid}
            >
              <TextFieldLabel>Email</TextFieldLabel>
              <TextFieldControl />
              {fieldState.error && (
                <TextFieldError>{fieldState.error.message}</TextFieldError>
              )}
            </TextField>
          );
        }}
      />

      <Controller
        control={control}
        name="framework"
        render={({ field }) => {
          return (
            <Select
              label="Framework"
              placeholder="Choose a framework"
              selectedKey={field.value === '' ? null : field.value}
              onSelectionChange={(key) => {
                field.onChange(String(key));
              }}
            >
              <SelectItem id="react">React</SelectItem>
              <SelectItem id="vue">Vue</SelectItem>
            </Select>
          );
        }}
      />

      <Controller
        control={control}
        name="terms"
        render={({ field, fieldState }) => {
          return (
            <Checkbox
              name={field.name}
              isSelected={field.value}
              onChange={field.onChange}
              isInvalid={fieldState.invalid}
            >
              Accept the terms
            </Checkbox>
          );
        }}
      />

      <FormActions>
        <FormSubmit>Send</FormSubmit>
      </FormActions>
    </Form>
  );
};

describe('@ttoss/forms bridge — RHF Controller + Zod over fsl-ui controls', () => {
  // react-hook-form resolves validation through real microtasks/timers.
  beforeEach(() => {
    jest.useRealTimers();
  });

  /** Fire an interaction and give react-hook-form's async cycle time to settle. */
  const interact = async (action: () => void) => {
    await act(async () => {
      action();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
  };

  test('invalid submit blocks onValid and surfaces the invalid state', async () => {
    const onValid = jest.fn();
    render(<BridgeForm onValid={onValid} />);

    await interact(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
    // fieldState.invalid reached the fsl-ui control (React Aria emits
    // aria-invalid on the underlying input).
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  test('valid submit delivers the typed values', async () => {
    const onValid = jest.fn();
    render(<BridgeForm onValid={onValid} />);

    await interact(() => {
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'ennio@example.com' },
      });
    });
    await interact(() => {
      fireEvent.click(
        screen.getByRole('button', { name: /Choose a framework/ })
      );
    });
    await interact(() => {
      fireEvent.click(screen.getByRole('option', { name: 'React' }));
    });
    await interact(() => {
      fireEvent.click(screen.getByRole('checkbox'));
    });
    await interact(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid.mock.calls[0]?.[0]).toEqual({
      email: 'ennio@example.com',
      framework: 'react',
      terms: true,
    });
  });

  test('fixing the error clears the invalid state (round trip)', async () => {
    const onValid = jest.fn();
    render(<BridgeForm onValid={onValid} />);

    await interact(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    await interact(() => {
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'x@y.z' },
      });
    });
    // Re-validation on change removes the message and the invalid flag.
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});
