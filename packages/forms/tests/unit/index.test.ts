import {
  ErrorMessage,
  Form,
  FormField,
  FormFieldInput,
  FormFieldRadio,
  yup,
  yupResolver,
} from '../../src';

test('should be defined', () => {
  expect(ErrorMessage).toBeDefined();
  expect(Form).toBeDefined();
  expect(FormField).toBeDefined();
  expect(FormFieldInput).toBeDefined();
  expect(FormFieldRadio).toBeDefined();
  expect(yup).toBeDefined();
  expect(yupResolver).toBeDefined();
});
