import {
  Form,
  FormErrorMessage,
  FormField,
  FormFieldInput,
  FormFieldRadio,
  yup,
  yupResolver,
  z,
  zodResolver,
} from '../../../src';

test('should be defined', () => {
  expect(Form).toBeDefined();
  expect(FormErrorMessage).toBeDefined();
  expect(FormField).toBeDefined();
  expect(FormFieldInput).toBeDefined();
  expect(FormFieldRadio).toBeDefined();
  expect(yup).toBeDefined();
  expect(yupResolver).toBeDefined();
  expect(z).toBeDefined();
  expect(zodResolver).toBeDefined();
});
