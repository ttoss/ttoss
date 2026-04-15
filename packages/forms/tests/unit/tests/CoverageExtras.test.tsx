import { render, screen } from '@ttoss/test-utils/react';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as BrazilIndex from 'src/Brazil';
import { FormErrorMessage } from 'src/FormErrorMessage';
// Import barrels and side-effect modules to increase coverage
import * as FormsIndex from 'src/index';
import * as MultistepIndex from 'src/MultistepForm';
import * as YupModule from 'src/yup/yup';
import * as ZodModule from 'src/zod/zod';

describe('Coverage extras', () => {
  test('barrel and side-effect modules import without error', () => {
    expect(typeof FormsIndex).toBe('object');
    expect(typeof ZodModule).toBe('object');
    expect(typeof YupModule).toBe('object');
    expect(typeof BrazilIndex).toBe('object');
    expect(typeof MultistepIndex).toBe('object');
  });

  test('yup and zod extensions exist', () => {
    // ensure yup extension methods were applied
    // use any casts because typings are augmented at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yupAny: any = (FormsIndex as any).yup;
    expect(typeof yupAny.string).toBe('function');
    // calling the method should return a schema-like object
    const maybeSchema = yupAny.string().cnpj;
    expect(maybeSchema !== undefined).toBeTruthy();

    // zod re-exports should be present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zAny: any = (FormsIndex as any).z;
    expect(zAny).toBeDefined();
    expect(typeof zAny.string).toBe('function');
  });

  test('FormErrorMessage renders JSON for non-string/non-descriptor messages', async () => {
    const TestComponent = () => {
      const methods = useForm();
      React.useEffect(() => {
        methods.setError('field', {
          type: 'manual',
          // message is an object (not string nor MessageDescriptor) — cast to any to test edge case
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message: { code: 'EXTRA', info: 'details' } as any,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <FormProvider {...methods}>
          <FormErrorMessage name="field" />
        </FormProvider>
      );
    };

    render(<TestComponent />);

    expect(
      await screen.findByText(
        JSON.stringify({ code: 'EXTRA', info: 'details' })
      )
    ).toBeInTheDocument();
  });
});
