import {
  Controller,
  FormProvider,
  useController,
  useFieldArray,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from '../../src';

test('should export all react-hook-form', () => {
  expect(useForm).toBeDefined();
  expect(useFormContext).toBeDefined();
  expect(useWatch).toBeDefined();
  expect(useFieldArray).toBeDefined();
  expect(useController).toBeDefined();
  expect(useFormState).toBeDefined();
  expect(Controller).toBeDefined();
  expect(FormProvider).toBeDefined();
});
